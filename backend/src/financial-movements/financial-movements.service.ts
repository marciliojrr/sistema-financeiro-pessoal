import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialMovement, MovementType } from 'src/database/entities/financial-movement.entity';
import { CreateFinancialMovementDto } from './dto/create-financial-movement.dto';
import { Profile } from 'src/database/entities/profile.entity';
import { FinancialCategory } from 'src/database/entities/financial-category.entity';
import { UpdateFinancialMovementDto } from './dto/update-financial-movement.dto';
import { Account } from 'src/database/entities/account.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { BudgetsService } from '../budgets/budgets.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DebtsService } from '../debts/debts.service';

@Injectable()
export class FinancialMovementsService {
  constructor(
    @InjectRepository(FinancialMovement)
    private readonly movementRepository: Repository<FinancialMovement>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(FinancialCategory)
    private readonly categoryRepository: Repository<FinancialCategory>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly budgetsService: BudgetsService,
    private readonly notificationsService: NotificationsService,
    private readonly debtsService: DebtsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(data: CreateFinancialMovementDto, userId: string) {
    // Profile: só pode ser usado se pertence ao usuário logado
    const profile = await this.profileRepository.findOne({
      where: { id: data.profileId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    if (profile.user.id !== userId)
      throw new ForbiddenException(
        'Acesso negado. Você só pode adicionar movimentações em seus próprios perfis.',
      );

    // Categoria (opcional)
    let category: FinancialCategory | null = null;
    if (data.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: data.categoryId },
      });

      if (!category) throw new NotFoundException('Categoria não encontrada.');
    }

    // Conta (opcional)
    let account: Account | null = null;
    if (data.accountId) {
      account = await this.accountRepository.findOne({
        where: { id: data.accountId },
        relations: ['profile', 'profile.user'],
      });

      if (!account) throw new NotFoundException('Conta não encontrada.');
      // Valida se a conta pertence ao mesmo usuário (via perfil)
      if (account.profile.user.id !== userId) {
        throw new ForbiddenException('Acesso negado. A conta não pertence ao usuário.');
      }
    }

    const movement = this.movementRepository.create({
      ...data,
      profile,
      category: category as any, // TypeORM handles null if nullable: true
      account: account as any,
      date: new Date(data.date),
    });
    const savedMovement = await this.movementRepository.save(movement);

    await this.auditLogsService.logChange(
      userId,
      'CREATE',
      'FinancialMovement',
      savedMovement.id,
      savedMovement,
    );

    // Check Budget Overflow (Competence View) - only if category is present
    if (category) {
      await this.budgetsService.checkBudgetOverflow(
        profile.id,
        category.id,
        data.amount,
        new Date(data.date),
      );
    }

    // Se for pagamento de dívida, recalcula o saldo devedor
    if (data.debtId && data.type === MovementType.EXPENSE) {
      await this.debtsService.recalculateRemainingAmount(
        data.debtId,
        data.amount,
      );
    }

    return savedMovement;
  }

  async findAll(userId: string, filters?: any) {
    // Busca todas as movimentações só dos perfis do usuário autenticado, com filtros
    const query = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.profile', 'profile')
      .leftJoinAndSelect('movement.category', 'category')
      .leftJoinAndSelect('movement.account', 'account')
      .leftJoin('profile.user', 'user')
      .where('profile.user.id = :userId', { userId });

    if (filters?.profileId)
      query.andWhere('profile.id = :profileId', {
        profileId: filters.profileId,
      });
    if (filters?.categoryId)
      query.andWhere('category.id = :categoryId', {
        categoryId: filters.categoryId,
      });
    if (filters?.accountId)
      query.andWhere('account.id = :accountId', {
        accountId: filters.accountId,
      });
    if (filters?.startDate)
      query.andWhere('movement.date >= :startDate', {
        startDate: filters.startDate,
      });
    if (filters?.endDate)
      query.andWhere('movement.date <= :endDate', {
        endDate: filters.endDate,
      });

    // Se scenarioId não for passado, filtra apenas os "reais" (scenarioId IS NULL)
    // Se scenarioId for passado, filtra por ele
    if (filters?.scenarioId) {
      query.andWhere('movement.scenarioId = :scenarioId', {
        scenarioId: filters.scenarioId,
      });
    } else {
      query.andWhere('movement.scenarioId IS NULL');
    }

    return query.orderBy('movement.date', 'DESC').getMany();
  }

  async findOne(id: string, userId: string) {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: ['profile', 'category', 'profile.user', 'account'],
    });

    if (!movement) throw new NotFoundException('Movimentação não encontrada.');
    if (movement.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    return movement;
  }

  async remove(id: string, userId: string) {
    const movement = await this.findOne(id, userId);
    await this.movementRepository.softDelete(id);

    await this.auditLogsService.logChange(
      userId,
      'DELETE',
      'FinancialMovement',
      id,
      { old: movement },
    );

    return { deleted: true };
  }

  async update(id: string, data: UpdateFinancialMovementDto, userId: string) {
    const movement = await this.movementRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.user', 'category', 'account'],
    });

    if (!movement) throw new NotFoundException('Movimentação não encontrada.');
    if (movement.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    // Se profileId for alterado, valide propriedade e existência
    if (data.profileId && data.profileId !== movement.profile.id) {
      const profile = await this.profileRepository.findOne({
        where: { id: data.profileId },
        relations: ['user'],
      });

      if (!profile) throw new NotFoundException('Perfil não encontrado.');
      if (profile.user.id !== userId)
        throw new ForbiddenException('Você só pode usar perfis próprios.');

      movement.profile = profile;
    }

    // Se categoryId for alterado, valide existência
    if (data.categoryId && data.categoryId !== movement.category.id) {
      const category = await this.categoryRepository.findOne({
        where: { id: data.categoryId },
      });

      if (!category) throw new NotFoundException('Categoria não encontrada.');

      movement.category = category;
    }

    // Se accountId for alterado, valide existência
    if (data.accountId && data.accountId !== movement.account?.id) {
      const account = await this.accountRepository.findOne({
        where: { id: data.accountId },
        relations: ['profile', 'profile.user'],
      });

      if (!account) throw new NotFoundException('Conta não encontrada.');
      if (account.profile.user.id !== userId) {
        throw new ForbiddenException('Acesso negado. A conta não pertence ao usuário.');
      }
      movement.account = account;
    }

    const oldMovement = { ...movement };

    // Atualiza demais propriedades
    if (data.amount !== undefined) movement.amount = data.amount;
    if (data.description !== undefined) movement.description = data.description;
    if (data.type !== undefined) movement.type = data.type;
    if (data.date !== undefined) movement.date = new Date(data.date);
    if (data.notes !== undefined) movement.notes = data.notes;

    const savedMovement = await this.movementRepository.save(movement);

    await this.auditLogsService.logChange(
      userId,
      'UPDATE',
      'FinancialMovement',
      savedMovement.id,
      { old: oldMovement, new: savedMovement },
    );

    return savedMovement;
  }
}
