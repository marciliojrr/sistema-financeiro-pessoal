import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { Budget } from '../database/entities/budget.entity';
import {
  FinancialMovement,
  MovementType,
} from '../database/entities/financial-movement.entity';
import { Reserve } from '../database/entities/reserve.entity';
import { Debt } from '../database/entities/debt.entity';
import { startOfMonth, endOfMonth, addDays, getDate } from 'date-fns';
import Decimal from 'decimal.js';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(FinancialMovement)
    private readonly movementRepo: Repository<FinancialMovement>,
    @InjectRepository(Reserve)
    private readonly reserveRepo: Repository<Reserve>,
    @InjectRepository(Debt)
    private readonly debtRepo: Repository<Debt>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkBudgets() {
    this.logger.log('Checking budgets...');
    const budgets = await this.budgetRepo.find({
      relations: ['profile', 'category'],
    });
    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);

    for (const budget of budgets) {
      const expenses = await this.movementRepo
        .createQueryBuilder('m')
        .select('SUM(m.amount)', 'total')
        .where('m.profileId = :profileId', { profileId: budget.profile.id })
        .andWhere('m.categoryId = :categoryId', {
          categoryId: budget.category.id,
        })
        .andWhere('m.date BETWEEN :start AND :end', { start, end })
        .andWhere('m.type = :type', { type: MovementType.EXPENSE })
        .getRawOne();

      const total = new Decimal(expenses.total || 0);
      const percentage = total.div(budget.amount).mul(100).toNumber();

      if (percentage >= 90) {
        // Create notification if not already created today (simplified check)
        const message =
          percentage >= 100
            ? `Alerta: Você excedeu seu orçamento de ${budget.category.name}!`
            : `Atenção: Você atingiu ${percentage.toFixed(0)}% do orçamento de ${budget.category.name}.`;

        await this.createNotification(
          budget.profile.id,
          'BUDGET_ALERT',
          message,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async processReserveAutoSave() {
    this.logger.log('Processing Reserve Auto-Save...');
    const today = new Date();
    const currentDay = today.getDate();

    const reserves = await this.reserveRepo.find({
      where: { autoSave: true, autoSaveDay: currentDay },
      relations: ['profile'],
    });

    for (const reserve of reserves) {
      // 1. Create Expense Movement
      const movement = this.movementRepo.create({
        amount: reserve.autoSaveAmount,
        type: MovementType.EXPENSE,
        date: today,
        description: `Auto-Save: ${reserve.name}`,
        profile: reserve.profile,
        // category? Needs a generic 'Savings' category or null.
      });
      await this.movementRepo.save(movement);

      // 2. Update Reserve Balance
      const currentAmount = new Decimal(reserve.currentAmount);
      const autoSaveAmount = new Decimal(reserve.autoSaveAmount);
      
      reserve.currentAmount = currentAmount.plus(autoSaveAmount).toNumber();
      await this.reserveRepo.save(reserve);

      await this.createNotification(
        reserve.profile.id,
        'AUTO_SAVE',
        `Economia automática de R$ ${reserve.autoSaveAmount} realizada para ${reserve.name}.`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkUpcomingBills() {
    this.logger.log('Checking upcoming bills...');
    const today = new Date();
    const targetDate = addDays(today, 3); // 3 days from now
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // 1. Check Movemens (Expenses) due in 3 days
    const movements = await this.movementRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.profile', 'profile')
      .where('m.type = :type', { type: MovementType.EXPENSE })
      .andWhere('DATE(m.date) = :targetDate', { targetDate: targetDateStr })
      .getMany();

    for (const mov of movements) {
      await this.createNotification(
        mov.profile.id,
        'BILL_REMINDER',
        `Lembrete: A despesa "${mov.description}" de R$ ${mov.amount} vence em 3 dias.`,
        true,
      );
    }

    // 2. Check Debts due on specific day
    const targetDay = getDate(targetDate);
    const debts = await this.debtRepo.find({
      where: { active: true, dueDateDay: targetDay },
      relations: ['profile'],
    });

    for (const debt of debts) {
      if (new Decimal(debt.remainingAmount).greaterThan(0)) {
        await this.createNotification(
          debt.profile.id,
          'BILL_REMINDER',
          `Lembrete: A dívida "${debt.description}" tem vencimento dia ${targetDay}.`,
          true,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async checkReserveGoals() {
    this.logger.log('Checking reserve goals...');
    const reserves = await this.reserveRepo.find({ relations: ['profile'] });
    const today = new Date();

    for (const reserve of reserves) {
      // 1. Check if Target Amount Met
      if (
        Number(reserve.targetAmount) > 0 &&
        Number(reserve.currentAmount) >= Number(reserve.targetAmount)
      ) {
        // Send notification if not already done? (Hard to track without state, but let's assume periodic reminder is OK or minimal dedupe)
        // Ideally we need a 'goalMetNotified' flag. For MVP, we'll confirm simply.
        // Let's filter to only notify if it JUST happened? No, cron runs daily.
        // Let's rely on "Notification" duplication logic if we had one.
        // For now, let's create a message.
        // To avoid spam, we could check if a similar notification exists for today.
        // Simplified:
        await this.createNotification(
          reserve.profile.id,
          'RESERVE_GOAL',
          `Parabéns! Você atingiu sua meta para a reserva ${reserve.name}.`,
          true, // checkDuplicate
        );
      }

      // 2. Check Deadline Approaching (within 7 days)
      if (
        reserve.targetDate &&
        Number(reserve.currentAmount) < Number(reserve.targetAmount)
      ) {
        const targetDate = new Date(reserve.targetDate);
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0 && diffDays <= 7) {
          await this.createNotification(
            reserve.profile.id,
            'RESERVE_GOAL',
            `Atenção: Faltam ${diffDays} dias para o prazo da reserva ${reserve.name}.`,
            true,
          );
        }
      }
    }
  }

  private async createNotification(
    profileId: string,
    type: string,
    message: string,
    checkDuplicate = false,
  ) {
    if (checkDuplicate) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const existing = await this.notificationRepo.findOne({
        where: {
          profile: { id: profileId },
          message,
          // createdAt: Between(start, end) // Need TypeORM Between import or simple querybuilder logic
        },
        order: { createdAt: 'DESC' },
      });

      // Simple dedupe: if exists recently, don't send.
      if (existing) {
        const diff = new Date().getTime() - existing.createdAt.getTime();
        const hours24 = 24 * 60 * 60 * 1000;
        if (diff < hours24) return;
      }
    }

    const notification = this.notificationRepo.create({
      profile: { id: profileId } as any,
      title:
        type === 'BUDGET_ALERT' // eslint-disable-line
          ? 'Alerta de Orçamento'
          : type === 'AUTO_SAVE'
            ? 'Poupança Automática'
            : 'Meta de Reserva',
      message,
      read: false,
    });
    await this.notificationRepo.save(notification);
  }
}
