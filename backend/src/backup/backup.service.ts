import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { FinancialCategory } from '../database/entities/financial-category.entity';
import { CreditCard } from '../database/entities/credit-card.entity';
import { InstallmentPurchase } from '../database/entities/installment-purchase.entity';
import { Debt } from '../database/entities/debt.entity';
import { Reserve } from '../database/entities/reserve.entity';
import { Budget } from '../database/entities/budget.entity';
import { RecurringTransaction } from '../database/entities/recurring-transaction.entity';
import { Profile } from '../database/entities/profile.entity';

export interface BackupData {
  exportDate: string;
  version: string;
  profileId: string;
  data: {
    categories: Partial<FinancialCategory>[];
    movements: Partial<FinancialMovement>[];
    creditCards: Partial<CreditCard>[];
    installmentPurchases: Partial<InstallmentPurchase>[];
    debts: Partial<Debt>[];
    reserves: Partial<Reserve>[];
    budgets: Partial<Budget>[];
    recurringTransactions: Partial<RecurringTransaction>[];
  };
}

@Injectable()
export class BackupService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(FinancialCategory)
    private readonly categoryRepository: Repository<FinancialCategory>,
    @InjectRepository(FinancialMovement)
    private readonly movementRepository: Repository<FinancialMovement>,
    @InjectRepository(CreditCard)
    private readonly creditCardRepository: Repository<CreditCard>,
    @InjectRepository(InstallmentPurchase)
    private readonly installmentRepository: Repository<InstallmentPurchase>,
    @InjectRepository(Debt)
    private readonly debtRepository: Repository<Debt>,
    @InjectRepository(Reserve)
    private readonly reserveRepository: Repository<Reserve>,
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(RecurringTransaction)
    private readonly recurringRepository: Repository<RecurringTransaction>,
  ) {}

  async exportBackup(userId: string, profileId: string): Promise<BackupData> {
    // Verify profile belongs to user
    const profile = await this.profileRepository.findOne({
      where: { id: profileId, user: { id: userId } },
    });

    if (!profile) {
      throw new Error('Profile not found or access denied');
    }

    // Fetch all data for this profile
    const [
      categories,
      movements,
      creditCards,
      installmentPurchases,
      debts,
      reserves,
      budgets,
      recurringTransactions,
    ] = await Promise.all([
      this.categoryRepository.find({ where: { profile: { id: profileId } } }),
      this.movementRepository.find({ where: { profile: { id: profileId } } }),
      this.creditCardRepository.find({ where: { profile: { id: profileId } } }),
      this.installmentRepository.find({
        where: { creditCard: { profile: { id: profileId } } },
      }),
      this.debtRepository.find({ where: { profile: { id: profileId } } }),
      this.reserveRepository.find({ where: { profile: { id: profileId } } }),
      this.budgetRepository.find({ where: { profile: { id: profileId } } }),
      this.recurringRepository.find({ where: { profile: { id: profileId } } }),
    ]);

    // Clean data (remove circular references)
    const cleanData = (items: unknown[]) =>
      items.map((item: Record<string, unknown>) => {
        const { profile: _, ...rest } = item;
        return rest;
      });

    return {
      exportDate: new Date().toISOString(),
      version: '1.0',
      profileId,
      data: {
        categories: cleanData(categories) as Partial<FinancialCategory>[],
        movements: cleanData(movements) as Partial<FinancialMovement>[],
        creditCards: cleanData(creditCards) as Partial<CreditCard>[],
        installmentPurchases: installmentPurchases.map((ip) => {
          const { creditCard: _, ...rest } = ip as unknown as Record<
            string,
            unknown
          >;
          return rest;
        }) as Partial<InstallmentPurchase>[],
        debts: cleanData(debts) as Partial<Debt>[],
        reserves: cleanData(reserves) as Partial<Reserve>[],
        budgets: cleanData(budgets) as Partial<Budget>[],
        recurringTransactions: cleanData(
          recurringTransactions,
        ) as Partial<RecurringTransaction>[],
      },
    };
  }

  async restoreBackup(
    userId: string,
    profileId: string,
    backup: BackupData,
  ): Promise<{ success: boolean; restored: Record<string, number> }> {
    // Verify profile belongs to user
    const profile = await this.profileRepository.findOne({
      where: { id: profileId, user: { id: userId } },
    });

    if (!profile) {
      throw new Error('Profile not found or access denied');
    }

    // Validate backup structure
    if (!backup.data || backup.version !== '1.0') {
      throw new Error('Invalid backup format');
    }

    const restored: Record<string, number> = {};

    // Delete existing data (in correct order due to FK constraints)
    await this.installmentRepository.delete({
      creditCard: { profile: { id: profileId } },
    });
    await this.movementRepository.delete({ profile: { id: profileId } });
    await this.recurringRepository.delete({ profile: { id: profileId } });
    await this.creditCardRepository.delete({ profile: { id: profileId } });
    await this.debtRepository.delete({ profile: { id: profileId } });
    await this.reserveRepository.delete({ profile: { id: profileId } });
    await this.budgetRepository.delete({ profile: { id: profileId } });
    await this.categoryRepository.delete({ profile: { id: profileId } });

    // Restore categories first (other entities may reference them)
    if (backup.data.categories?.length) {
      const categories = backup.data.categories.map((cat) => ({
        ...cat,
        profile: { id: profileId },
      }));
      await this.categoryRepository.save(categories);
      restored.categories = categories.length;
    }

    // Restore credit cards
    if (backup.data.creditCards?.length) {
      const cards = backup.data.creditCards.map((card) => ({
        ...card,
        profile: { id: profileId },
      }));
      await this.creditCardRepository.save(cards);
      restored.creditCards = cards.length;
    }

    // Restore movements
    if (backup.data.movements?.length) {
      const movements = backup.data.movements.map((mov) => ({
        ...mov,
        profile: { id: profileId },
      }));
      await this.movementRepository.save(movements);
      restored.movements = movements.length;
    }

    // Restore debts
    if (backup.data.debts?.length) {
      const debts = backup.data.debts.map((debt) => ({
        ...debt,
        profile: { id: profileId },
      }));
      await this.debtRepository.save(debts);
      restored.debts = debts.length;
    }

    // Restore reserves
    if (backup.data.reserves?.length) {
      const reserves = backup.data.reserves.map((res) => ({
        ...res,
        profile: { id: profileId },
      }));
      await this.reserveRepository.save(reserves);
      restored.reserves = reserves.length;
    }

    // Restore budgets
    if (backup.data.budgets?.length) {
      const budgets = backup.data.budgets.map((bud) => ({
        ...bud,
        profile: { id: profileId },
      }));
      await this.budgetRepository.save(budgets);
      restored.budgets = budgets.length;
    }

    // Restore recurring transactions
    if (backup.data.recurringTransactions?.length) {
      const recurring = backup.data.recurringTransactions.map((rec) => ({
        ...rec,
        profile: { id: profileId },
      }));
      await this.recurringRepository.save(recurring);
      restored.recurringTransactions = recurring.length;
    }

    return { success: true, restored };
  }
}
