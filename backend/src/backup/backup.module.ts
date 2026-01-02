import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { Profile } from '../database/entities/profile.entity';
import { FinancialCategory } from '../database/entities/financial-category.entity';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { CreditCard } from '../database/entities/credit-card.entity';
import { InstallmentPurchase } from '../database/entities/installment-purchase.entity';
import { Debt } from '../database/entities/debt.entity';
import { Reserve } from '../database/entities/reserve.entity';
import { Budget } from '../database/entities/budget.entity';
import { RecurringTransaction } from '../database/entities/recurring-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      FinancialCategory,
      FinancialMovement,
      CreditCard,
      InstallmentPurchase,
      Debt,
      Reserve,
      Budget,
      RecurringTransaction,
    ]),
  ],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
