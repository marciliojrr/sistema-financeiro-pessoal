import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import {
  RecurringTransaction,
  RecurrenceFrequency,
} from '../database/entities/recurring-transaction.entity';
import { Reserve } from '../database/entities/reserve.entity';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { FinancialCategory } from '../database/entities/financial-category.entity';
import { Profile } from '../database/entities/profile.entity';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';

import { BudgetsService } from '../budgets/budgets.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MovementType } from '../database/entities/financial-movement.entity';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class RecurringTransactionsService {
  constructor(
    @InjectRepository(RecurringTransaction)
    private readonly recurringRepo: Repository<RecurringTransaction>,

    @InjectRepository(FinancialMovement)
    private readonly movementRepo: Repository<FinancialMovement>,

    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,

    @InjectRepository(FinancialCategory)
    private readonly categoryRepo: Repository<FinancialCategory>,

    @InjectRepository(Reserve)
    private readonly reserveRepo: Repository<Reserve>,

    private readonly budgetsService: BudgetsService,
    private readonly notificationsService: NotificationsService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(data: CreateRecurringTransactionDto, userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { id: data.profileId },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Perfil não encontrado.');
    if (profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    let category: FinancialCategory | undefined = undefined;
    if (data.categoryId) {
      const found = await this.categoryRepo.findOne({
        where: { id: data.categoryId },
      });
      if (!found) throw new NotFoundException('Categoria não encontrada.');
      category = found;
    }

    let reserve: Reserve | undefined = undefined;
    if (data.reserveId) {
      const found = await this.reserveRepo.findOne({
        where: { id: data.reserveId },
      });
      if (!found) throw new NotFoundException('Reserva não encontrada.');
      reserve = found;
    }

    // Calcular nextRun: se skipPastRuns=true e startDate < hoje, avança para a próxima data futura
    let nextRun = new Date(data.startDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (data.skipPastRuns && nextRun < now) {
      // Avança nextRun até ser >= hoje
      while (nextRun < now) {
        nextRun = this.calculateNextRun(nextRun, data.frequency);
      }
    }

    const transaction = this.recurringRepo.create({
      ...data,
      profile,
      category,
      reserve,
      nextRun, // Usa a data calculada (futura se skipPastRuns)
    });

    const savedTransaction = await this.recurringRepo.save(transaction);

    await this.auditLogsService.logChange(
      userId,
      'CREATE',
      'RecurringTransaction',
      savedTransaction.id,
      savedTransaction,
    );

    return savedTransaction;
  }

  async findAll(profileId: string, userId: string) {
    const list = await this.recurringRepo.find({
      where: { profile: { id: profileId } },
      relations: ['category', 'reserve', 'profile', 'profile.user'],
    });
    return list.filter((item) => item.profile.user.id === userId);
  }

  async findAllByUser(userId: string) {
    return this.recurringRepo.find({
      where: { profile: { user: { id: userId } } },
      relations: ['category', 'reserve', 'profile'],
    });
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.recurringRepo.findOne({
      where: { id },
      relations: ['category', 'profile', 'reserve', 'profile.user'],
    });

    if (!transaction) throw new NotFoundException('Transação não encontrada.');
    if (transaction.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    return transaction;
  }

  async update(
    id: string,
    data: UpdateRecurringTransactionDto,
    userId: string,
  ) {
    const transaction = await this.recurringRepo.findOne({
      where: { id },
      relations: ['profile', 'profile.user'],
    });
    if (!transaction)
      throw new NotFoundException('Transação recorrente não encontrada.');

    if (transaction.profile.user.id !== userId)
      throw new ForbiddenException('Acesso negado.');

    const oldTransaction = { ...transaction };

    // Atualização simples dos campos
    Object.assign(transaction, data);

    const saved = await this.recurringRepo.save(transaction);

    await this.auditLogsService.logChange(
      userId,
      'UPDATE',
      'RecurringTransaction',
      saved.id,
      { old: oldTransaction, new: saved },
    );

    return saved;
  }

  async remove(id: string, userId: string) {
    const transaction = await this.findOne(id, userId); // Já verifica permissão

    await this.recurringRepo.softDelete(id);

    await this.auditLogsService.logChange(
      userId,
      'DELETE',
      'RecurringTransaction',
      id,
      { old: transaction },
    );
  }

  // --- LÓGICA DE AUTOM DO CRON ---
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processPendingTransactions() {
    const now = new Date();

    // Buscar todas as ativas onde nextRun <= agora
    const pendings = await this.recurringRepo.find({
      where: {
        active: true,
        nextRun: LessThanOrEqual(now),
      },
      relations: ['profile', 'category', 'reserve'],
    });

    console.log(
      `[Cron] Encontradas ${pendings.length} transações recorrentes para processar.`,
    );

    for (const item of pendings) {
      // 1. Criar a movimentação (Sempre cria, pois sai dinheiro da conta corrente)
      // Se for reinforcement de reserva, é uma DESPESA/SAÍDA da conta corrente indo para a reserva
      const movement = this.movementRepo.create({
        description: item.description + ' (Recorrente)',
        amount: item.amount,
        type: item.type, // Se for para reserva, deve ser EXPENSE na conta
        date: item.nextRun,
        profile: item.profile,
        category: item.category,
      });

      await this.movementRepo.save(movement);

      // 1.5 Se estiver vinculado a uma Reserva, atualiza o saldo da reserva
      if (item.reserve) {
        // Aumenta o valor da reserva (Investimento)
        item.reserve.currentAmount =
          Number(item.reserve.currentAmount) + Number(item.amount);

        // Verifica se antigiu a meta
        if (
          item.reserve.targetAmount &&
          item.reserve.currentAmount >= item.reserve.targetAmount
        ) {
          // Notifica Conquista!
          await this.notificationsService.create({
            title: 'Meta Atingida! 🏆',
            message: `Parabéns! Sua reserva "${item.reserve.name}" atingiu o objetivo com o aporte automático de hoje.`,
            type: 'INFO',
            profileId: item.profile.id,
          } as any);
        }
        await this.reserveRepo.save(item.reserve);
      }

      // [NOVO] Verificar estouro de Orçamento (Apenas se não for reserva, ou se o usuário quiser controlar gastos com investimento??)
      // Assumindo que investimento também entra no orçamento de "Investimentos"
      if (item.type === MovementType.EXPENSE) {
        await this.checkBudgetOverflow(
          item.profile,
          item.category,
          item.amount,
          movement.date,
        );
      }

      // 2. Atualizar lastRun e nextRun
      item.lastRun = item.nextRun; // Foi executado referente a esta data
      item.nextRun = this.calculateNextRun(item.nextRun, item.frequency);

      // Verificar se passou do endDate (se houver)
      if (item.endDate && item.nextRun > item.endDate) {
        item.active = false; // Desativa se acabou o prazo
      }

      await this.recurringRepo.save(item);
    }
  }

  private calculateNextRun(
    currentDate: Date,
    frequency: RecurrenceFrequency,
  ): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case RecurrenceFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RecurrenceFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RecurrenceFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  private async checkBudgetOverflow(
    profile: Profile,
    category: FinancialCategory,
    amountAdded: number,
    date: Date,
  ) {
    if (!category) return;

    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const budget = await this.budgetsService.findByCategory(
      profile.id,
      category.id,
      month,
      year,
    );

    if (!budget) return;

    const { sum } = await this.movementRepo
      .createQueryBuilder('movement')
      .select('SUM(movement.amount)', 'sum')
      .where('movement.profile.id = :profileId', { profileId: profile.id })
      .andWhere('movement.category.id = :categoryId', {
        categoryId: category.id,
      })
      .andWhere('movement.type = :type', { type: MovementType.EXPENSE })
      .andWhere('EXTRACT(MONTH FROM movement.date) = :month', { month })
      .andWhere('EXTRACT(YEAR FROM movement.date) = :year', { year })
      .getRawOne();

    const currentTotal = Number(sum || 0);

    if (currentTotal > budget.amount) {
      await this.notificationsService.create({
        title: 'Orçamento Estourado (Recorrência)!',
        message: `A transação automática de ${category.name} estourou o orçamento para ${month}/${year}. Planejado: R$ ${budget.amount}, Realizado: R$ ${currentTotal}.`,
        type: 'WARNING',
        profileId: profile.id,
      } as any);
    } else if (currentTotal >= budget.amount * 0.9) {
      await this.notificationsService.create({
        title: 'Atenção ao Orçamento',
        message: `Você atingiu 90% do orçamento de ${category.name} após transação automática.`,
        type: 'INFO',
        profileId: profile.id,
      } as any);
    }
  }
}
