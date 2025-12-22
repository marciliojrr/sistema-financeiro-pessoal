import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { RecurringTransactionsController } from './recurring-transactions.controller';
import { RecurringTasksService } from './recurring-tasks.service';
import { RecurringTransaction } from '../database/entities/recurring-transaction.entity';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { FinancialCategory } from '../database/entities/financial-category.entity';
import { Profile } from '../database/entities/profile.entity';
import { Reserve } from '../database/entities/reserve.entity';
import { BudgetsModule } from '../budgets/budgets.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecurringTransaction,
      FinancialMovement,
      FinancialCategory,
      Profile,
      Reserve,
    ]),
    BudgetsModule,
    NotificationsModule,
  ],
  controllers: [RecurringTransactionsController],
  providers: [RecurringTransactionsService, RecurringTasksService],
  exports: [RecurringTransactionsService],
})
export class RecurringTransactionsModule {}
