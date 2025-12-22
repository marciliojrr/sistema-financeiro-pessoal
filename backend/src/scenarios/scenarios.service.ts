import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DeepPartial } from 'typeorm';
import { FinancialScenario } from '../database/entities/financial-scenario.entity';
import { CreateScenarioDto } from './dto/create-scenario.dto';
import { Profile } from '../database/entities/profile.entity';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { RecurringTransaction } from '../database/entities/recurring-transaction.entity';

@Injectable()
export class ScenariosService {
  constructor(
    @InjectRepository(FinancialScenario)
    private readonly scenarioRepo: Repository<FinancialScenario>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(FinancialMovement)
    @InjectRepository(FinancialMovement)
    private readonly movementRepo: Repository<FinancialMovement>,
    @InjectRepository(RecurringTransaction)
    private readonly recurringRepo: Repository<RecurringTransaction>,
  ) {}

  async create(userId: string, dto: CreateScenarioDto) {
    const profile = await this.profileRepo.findOne({
      where: { id: dto.profileId },
      relations: ['user'],
    });

    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    if (profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    const scenario = this.scenarioRepo.create({
      ...dto,
      profile,
    });

    const savedScenario = await this.scenarioRepo.save(scenario);

    // Clone data if requested
    if (dto.cloneRealData) {
      await this.cloneRealToScenario(
        savedScenario.id,
        savedScenario.profile.id,
      );
    }

    return savedScenario;
  }

  async cloneRealToScenario(scenarioId: string, profileId: string) {
    // 1. Clone Financial Movements
    const movements = await this.movementRepo.find({
      where: { profile: { id: profileId }, scenarioId: IsNull() },
    });

    const newMovements = movements.map((m) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...rest } = m;
      return this.movementRepo.create({
        ...rest,
        scenarioId,
        profile: { id: profileId } as any,
      } as DeepPartial<FinancialMovement>);
    });

    if (newMovements.length > 0) {
      await this.movementRepo.save(newMovements);
    }

    // 2. Clone Recurring Transactions
    const recurring = await this.recurringRepo.find({
      where: { profile: { id: profileId }, scenarioId: IsNull() },
    });

    const newRecurring = recurring.map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, lastRun, ...rest } = r;
      // lastRun reset? Or copy? Let's copy state.
      return this.recurringRepo.create({
        ...rest,
        lastRun,
        scenarioId,
        profile: { id: profileId } as any,
      } as DeepPartial<RecurringTransaction>);
    });

    if (newRecurring.length > 0) {
      await this.recurringRepo.save(newRecurring);
    }
  }

  async findAll(userId: string) {
    return this.scenarioRepo.find({
      where: { profile: { user: { id: userId } } },
      relations: ['profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const scenario = await this.scenarioRepo.findOne({
      where: { id },
      relations: ['profile', 'profile.user'],
    });

    if (!scenario) throw new NotFoundException('Cenário não encontrado.');
    if (scenario.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    return scenario;
  }

  async remove(id: string, userId: string) {
    const scenario = await this.findOne(id, userId);
    return this.scenarioRepo.remove(scenario);
  }
  async getSummary(scenarioId: string, userId: string) {
    const scenario = await this.findOne(scenarioId, userId);

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    return this.calculateStats({
      profileId: scenario.profile.id,
      scenarioId: scenario.id,
      start,
      end,
    });
  }

  async getComparison(scenarioId: string, userId: string) {
    const scenario = await this.findOne(scenarioId, userId);

    // 1. Calculate Real Stats (Current Month)
    // We assume Comparison is usually about "Monthly Budget" impact
    // If we want "All time", remove date filters. Let's do CURRENT MONTH for consistency with Dashboard.
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const realStats = await this.calculateStats({
      profileId: scenario.profile.id,
      scenarioId: null, // Mean Real Data
      start,
      end,
    });

    const scenarioStats = await this.calculateStats({
      profileId: scenario.profile.id,
      scenarioId: scenario.id,
      start,
      end,
    });

    return {
      period: { start, end },
      real: realStats,
      scenario: scenarioStats,
      diff: {
        income: scenarioStats.income - realStats.income,
        expense: scenarioStats.expense - realStats.expense,
        balance: scenarioStats.balance - realStats.balance,
      },
    };
  }

  private async calculateStats(filters: {
    profileId: string;
    scenarioId: string | null;
    start: Date;
    end: Date;
  }) {
    const qb = this.movementRepo
      .createQueryBuilder('m')
      .select('m.type', 'type')
      .addSelect('SUM(m.amount)', 'total')
      .where('m.profileId = :profileId', { profileId: filters.profileId })
      .andWhere('m.date BETWEEN :start AND :end', {
        start: filters.start,
        end: filters.end,
      });

    if (filters.scenarioId) {
      qb.andWhere('m.scenarioId = :scenarioId', {
        scenarioId: filters.scenarioId,
      });
    } else {
      qb.andWhere('m.scenarioId IS NULL');
    }

    qb.groupBy('m.type');

    const result = await qb.getRawMany();
    // result example: [ { type: 'INCOME', total: '1000' }, { type: 'EXPENSE', total: '500' } ]

    let income = 0;
    let expense = 0;

    result.forEach((r) => {
      if (r.type === 'INCOME') income = Number(r.total);
      if (r.type === 'EXPENSE') expense = Number(r.total);
    });

    return {
      income,
      expense,
      balance: income - expense,
    };
  }
}
