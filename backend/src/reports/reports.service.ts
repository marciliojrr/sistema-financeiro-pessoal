import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FinancialMovement,
  MovementType,
} from '../database/entities/financial-movement.entity';
import { Budget } from '../database/entities/budget.entity';
import { Reserve } from '../database/entities/reserve.entity';
import { Parser } from 'json2csv';
import { NotificationsService } from '../notifications/notifications.service';
import { RecurringTransactionsService } from '../recurring-transactions/recurring-transactions.service';
import Decimal from 'decimal.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(FinancialMovement)
    private readonly movementRepository: Repository<FinancialMovement>,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Reserve)
    private readonly reserveRepository: Repository<Reserve>,
    private readonly notificationsService: NotificationsService,
    private readonly recurringService: RecurringTransactionsService,
  ) {}

  async getMonthlyBalance(
    userId: string,
    month: number,
    year: number,
    profileId?: string,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const query = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.profile', 'profile')
      .leftJoin('profile.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('movement.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (profileId) {
      query.andWhere('profile.id = :profileId', { profileId });
    }

    const movements = await query.getMany();

    // Using Decimal for precise accumulation
    const totalIncome = movements
      .filter((m) => m.type === MovementType.INCOME)
      .reduce((acc, m) => acc.plus(m.amount), new Decimal(0))
      .toNumber();

    const totalExpense = movements
      .filter((m) => m.type === MovementType.EXPENSE)
      .reduce((acc, m) => acc.plus(m.amount), new Decimal(0))
      .toNumber();

    const balance = new Decimal(totalIncome).minus(totalExpense).toNumber();

    return {
      month,
      year,
      totalIncome,
      totalExpense,
      balance,
    };
  }

  async getExpensesByCategory(
    userId: string,
    month: number,
    year: number,
    isFixed?: boolean,
    profileId?: string,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const query = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.category', 'category')
      .leftJoin('movement.profile', 'profile')
      .leftJoin('profile.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('movement.type = :type', { type: MovementType.EXPENSE })
      .andWhere('movement.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (profileId) {
      query.andWhere('profile.id = :profileId', { profileId });
    }

    const movements = await query.getMany();

    const categoryMap = new Map();
    movements.forEach((m) => {
      const categoryName = m.category ? m.category.name : 'Sem Categoria';
      const current = categoryMap.get(categoryName) || new Decimal(0);
      categoryMap.set(categoryName, current.plus(m.amount));
    });

    return Array.from(categoryMap.entries()).map(
      ([category, amount]: [string, any]) => ({
        category,
        amount: amount.toNumber(),
      }),
    );
  }

  async getBudgetPlanning(
    userId: string,
    month: number,
    year: number,
    profileId?: string,
  ) {
    const budgetQuery = this.budgetRepository
      .createQueryBuilder('budget')
      .leftJoinAndSelect('budget.category', 'category')
      .leftJoin('budget.profile', 'profile')
      .leftJoin('profile.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('budget.month = :month', { month })
      .andWhere('budget.year = :year', { year });

    if (profileId) {
      budgetQuery.andWhere('profile.id = :profileId', { profileId });
    }

    const budgets = await budgetQuery.getMany();

    const expenses = await this.getExpensesByCategory(
      userId,
      month,
      year,
      undefined,
      profileId,
    );

    const report = budgets.map((b) => {
      const categoryName = b.category ? b.category.name : 'Geral';

      const actual: number = b.category
        ? expenses.find((e) => e.category === b.category.name)?.amount || 0
        : expenses.reduce((sum, e) => sum + e.amount, 0); // Still standard JS addition for already-processed numbers (safe enough for display? or convert back?)
      // Let's rely on standard add for already toNumber() results for now as getExpenses returns numbers.

      const budgetAmount = new Decimal(b.amount);
      const actualAmount = new Decimal(actual);

      return {
        budget: b.amount,
        category: categoryName,
        actual,
        remaining: budgetAmount.minus(actualAmount).toNumber(),
        alertThreshold: budgetAmount.times(0.9).toNumber(),
      };
    });

    return report;
  }

  async getReservesProgress(userId: string, profileId?: string) {
    const query = this.reserveRepository
      .createQueryBuilder('reserve')
      .leftJoinAndSelect('reserve.profile', 'profile')
      .leftJoin('profile.user', 'user')
      .where('user.id = :userId', { userId });

    if (profileId) {
      query.andWhere('profile.id = :profileId', { profileId });
    }

    const reserves = await query.getMany();

    return reserves.map((r) => {
      const current = new Decimal(r.currentAmount);
      const target = new Decimal(r.targetAmount);

      return {
        name: r.name,
        current: current.toNumber(),
        target: target.toNumber(),
        percentage:
          r.targetAmount > 0 ? current.div(target).times(100).toNumber() : 0,
        targetDate: r.targetDate,
      };
    });
  }

  async exportData(userId: string, profileId?: string) {
    const query = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.category', 'category')
      .leftJoinAndSelect('movement.profile', 'profile')
      .leftJoin('profile.user', 'user')
      .where('user.id = :userId', { userId });

    if (profileId) {
      query.andWhere('profile.id = :profileId', { profileId });
    }

    const movements = await query.orderBy('movement.date', 'DESC').getMany();

    const data = movements.map((m) => ({
      Date: m.date,
      Profile: m.profile.name,
      Type: m.type,
      Category: m.category?.name || 'N/A',
      Description: m.description,
      Amount: Number(m.amount), // Ensure number export
      Fixed: m.category?.isFixed ? 'Yes' : 'No',
    }));

    const json2csvParser = new Parser();
    return json2csvParser.parse(data);
  }

  async getDashboardSummary(userId: string, profileId?: string) {
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // 1. Monthly Balance
    const balance = await this.getMonthlyBalance(
      userId,
      month,
      year,
      profileId,
    );

    // 2. Notifications (Unread) - Need to fetch unread
    // NotificationsService currently lacks findUnread method specifically exposed easily,
    // but findAll accepts filters.
    const notifications = await this.notificationsService.findAll(userId, {
      read: 'false',
    });
    const unreadCount = notifications.length;

    // 3. Upcoming Recurring Bills (Next 7 days)
    // We need to fetch all recurring transactions for this user/profile
    // Since RecurringTransactionsService.findAll takes profileId, we need one.
    // If profileId is MIA, we might skip or fetch for all user profiles (complex).
    // Assuming profileId is passed for dashboard context usually.

    let upcomingBills: any[] = [];
    if (profileId) {
      const recurrings = await this.recurringService.findAll(profileId, userId);
      // Filter active and nextRun within 7 days
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + 7);

      upcomingBills = recurrings
        .filter(
          (r) =>
            r.active &&
            new Date(r.nextRun) <= limitDate &&
            new Date(r.nextRun) >= new Date(),
        )
        .map((r) => ({
          description: r.description,
          amount: r.amount,
          date: r.nextRun,
          category: r.category?.name,
        }));
    }

    return {
      balance,
      unreadNotifications: unreadCount,
      upcomingBills,
      currentMonth: month,
      currentYear: year,
    };
  }
}
