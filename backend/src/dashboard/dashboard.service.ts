import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FinancialMovement,
  MovementType,
} from '../database/entities/financial-movement.entity';
import { Budget } from '../database/entities/budget.entity';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(FinancialMovement)
    private readonly movementRepo: Repository<FinancialMovement>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
  ) {}

  async getSummary(userId: string, profileId?: string) {
    const qb = this.movementRepo
      .createQueryBuilder('m')
      .leftJoin('m.profile', 'p')
      .where('p.userId = :userId', { userId });

    if (profileId) {
      qb.andWhere('m.profileId = :profileId', { profileId });
    }

    const today = new Date();
    const start = startOfMonth(today);
    const end = endOfMonth(today);

    qb.andWhere('m.date BETWEEN :start AND :end', { start, end });
    // Exclude credit card deferred items (Cash Basis view - only counting Invoice Payment)
    qb.andWhere('m.installmentPurchaseId IS NULL');
    qb.andWhere('m.invoiceId IS NULL');

    const movements = await qb.getMany();

    const income = movements
      .filter((m) => m.type === MovementType.INCOME)
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const expense = movements
      .filter((m) => m.type === MovementType.EXPENSE)
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    return {
      income,
      expense,
      balance,
      savingsRate: savingsRate.toFixed(2),
    };
  }

  async getCategoryCharts(userId: string, profileId?: string) {
    const qb = this.movementRepo
      .createQueryBuilder('m')
      .leftJoin('m.profile', 'p')
      .leftJoin('m.category', 'c')
      .select('c.name', 'category')
      .addSelect('SUM(m.amount)', 'total')
      .where('p.userId = :userId', { userId })
      .andWhere('m.type = :type', { type: MovementType.EXPENSE });

    if (profileId) {
      qb.andWhere('m.profileId = :profileId', { profileId });
    }

    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    qb.andWhere('m.date BETWEEN :start AND :end', { start, end });

    qb.groupBy('c.name');

    const result = await qb.getRawMany();
    return result.map((r) => ({
      category: r.category || 'Outros',
      total: Number(r.total),
    }));
  }

  async getEvolutionCharts(userId: string, profileId?: string) {
    // Last 6 months
    const today = new Date();
    const start = startOfMonth(subMonths(today, 5));
    const end = endOfMonth(today);

    const qb = this.movementRepo
      .createQueryBuilder('m')
      .leftJoin('m.profile', 'p')
      .select("TO_CHAR(m.date, 'YYYY-MM')", 'month') // Postgres specific
      .addSelect('m.type', 'type')
      .addSelect('SUM(m.amount)', 'total')
      .where('p.userId = :userId', { userId })
      .andWhere('m.date BETWEEN :start AND :end', { start, end });

    if (profileId) {
      qb.andWhere('m.profileId = :profileId', { profileId });
    }

    qb.groupBy("TO_CHAR(m.date, 'YYYY-MM')").addGroupBy('m.type');
    qb.orderBy('month', 'ASC');

    const raw = await qb.getRawMany();

    // Process raw to friendly format
    const grouped = {};
    raw.forEach((r) => {
      if (!grouped[r.month]) grouped[r.month] = { income: 0, expense: 0 };
      if (r.type === MovementType.INCOME)
        grouped[r.month].income = Number(r.total);
      else grouped[r.month].expense = Number(r.total);
    });

    return Object.keys(grouped).map((month) => ({
      month,
      ...grouped[month],
      balance: grouped[month].income - grouped[month].expense,
    }));
  }
}
