import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialMovementsService } from './financial-movements.service';
import { FinancialMovementsController } from './financial-movements.controller';
import { FinancialMovement } from '../database/entities/financial-movement.entity';
import { Profile } from '../database/entities/profile.entity';
import { FinancialCategory } from '../database/entities/financial-category.entity';
import { BudgetsModule } from '../budgets/budgets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Account } from '../database/entities/account.entity';
import { DebtsModule } from '../debts/debts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FinancialMovement, Profile, FinancialCategory, Account]),
    BudgetsModule,
    NotificationsModule,
    DebtsModule,
  ],
  providers: [FinancialMovementsService],
  controllers: [FinancialMovementsController],
  exports: [FinancialMovementsService],
})
export class FinancialMovementsModule {}
