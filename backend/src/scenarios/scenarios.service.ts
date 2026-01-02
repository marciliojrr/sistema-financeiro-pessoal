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
import Decimal from 'decimal.js';

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

    let income = new Decimal(0);
    let expense = new Decimal(0);

    result.forEach((r) => {
      if (r.type === 'INCOME') income = income.plus(r.total || 0);
      if (r.type === 'EXPENSE') expense = expense.plus(r.total || 0);
    });

    return {
      income: income.toNumber(),
      expense: expense.toNumber(),
      balance: income.minus(expense).toNumber(),
    };
  }

  async getSmartSuggestions(
    scenarioId: string,
    userId: string,
    purchaseAmount?: number,
    installments?: number,
  ) {
    const comparison = await this.getComparison(scenarioId, userId);
    const suggestions: {
      type: 'warning' | 'info' | 'success' | 'tip';
      icon: string;
      title: string;
      description: string;
    }[] = [];

    const scenarioBalance = comparison.scenario.balance;
    const realBalance = comparison.real.balance;
    const scenarioExpense = comparison.scenario.expense;
    const realIncome = comparison.real.income;

    // Rule 1: Check if scenario has negative balance
    if (scenarioBalance < 0) {
      suggestions.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Saldo Negativo',
        description: `Este cenário resultaria em um saldo negativo de R$ ${Math.abs(scenarioBalance).toFixed(2)}.`,
      });
    }

    // Rule 2: Check if expense increased significantly (>30%)
    const expenseIncrease = scenarioExpense - comparison.real.expense;
    const expenseIncreasePercent = comparison.real.expense > 0
      ? (expenseIncrease / comparison.real.expense) * 100
      : 0;

    if (expenseIncreasePercent > 30) {
      suggestions.push({
        type: 'warning',
        icon: '📈',
        title: 'Aumento Significativo de Despesas',
        description: `As despesas aumentariam ${expenseIncreasePercent.toFixed(0)}% em relação ao cenário real.`,
      });
    }

    // Rule 3: If there's a purchase with installments, analyze impact
    if (purchaseAmount && installments && installments > 1) {
      const monthlyInstallment = purchaseAmount / installments;
      const installmentPercent = realIncome > 0
        ? (monthlyInstallment / realIncome) * 100
        : 0;

      if (installmentPercent > 30) {
        suggestions.push({
          type: 'warning',
          icon: '💳',
          title: 'Parcela Comprometedora',
          description: `A parcela de R$ ${monthlyInstallment.toFixed(2)} representa ${installmentPercent.toFixed(0)}% da sua renda mensal.`,
        });
      } else if (installmentPercent > 15) {
        suggestions.push({
          type: 'info',
          icon: '💡',
          title: 'Parcela Significativa',
          description: `A parcela de R$ ${monthlyInstallment.toFixed(2)} representa ${installmentPercent.toFixed(0)}% da sua renda. Considere alternativas.`,
        });
      }

      // Suggest alternative installment options
      if (installments < 24) {
        const alternativeInstallments = installments + 6;
        const alternativeMonthly = purchaseAmount / alternativeInstallments;
        suggestions.push({
          type: 'tip',
          icon: '🔢',
          title: 'Alternativa de Parcelamento',
          description: `Em ${alternativeInstallments}x, a parcela seria R$ ${alternativeMonthly.toFixed(2)} (-${((monthlyInstallment - alternativeMonthly) / monthlyInstallment * 100).toFixed(0)}%).`,
        });
      }
    }

    // Rule 4: Check reserves impact
    const balanceDiff = scenarioBalance - realBalance;
    if (balanceDiff < -500) {
      suggestions.push({
        type: 'info',
        icon: '🎯',
        title: 'Impacto nas Reservas',
        description: `Este cenário reduziria seu saldo em R$ ${Math.abs(balanceDiff).toFixed(2)}. Suas metas de reserva podem ser afetadas.`,
      });
    }

    // Rule 5: Positive feedback if scenario is healthy
    if (scenarioBalance > 0 && expenseIncreasePercent <= 10) {
      suggestions.push({
        type: 'success',
        icon: '✅',
        title: 'Cenário Saudável',
        description: 'Este cenário parece viável financeiramente! Saldo positivo e despesas controladas.',
      });
    }

    // Rule 6: Suggest waiting if balance is tight
    if (scenarioBalance >= 0 && scenarioBalance < 200) {
      suggestions.push({
        type: 'tip',
        icon: '⏳',
        title: 'Aguarde o Próximo Mês',
        description: 'Seu saldo ficaria apertado. Considere adiar essa decisão para o próximo mês.',
      });
    }

    return {
      comparison,
      suggestions,
      summary: {
        totalSuggestions: suggestions.length,
        warnings: suggestions.filter((s) => s.type === 'warning').length,
        tips: suggestions.filter((s) => s.type === 'tip').length,
      },
    };
  }
}

