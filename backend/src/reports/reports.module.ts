import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { Budget } from '../database/entities/budget.entity';
import { Reserve } from '../database/entities/reserve.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { RecurringTransactionsModule } from '../recurring-transactions/recurring-transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialMovement, Budget, Reserve]),
    NotificationsModule,
    RecurringTransactionsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
