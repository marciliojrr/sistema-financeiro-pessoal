import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { Budget } from 'src/database/entities/budget.entity';
import { Profile } from 'src/database/entities/profile.entity';
import { FinancialCategory } from 'src/database/entities/financial-category.entity';
import { FinancialMovement } from 'src/database/entities/financial-movement.entity';
import { InstallmentPurchase } from 'src/database/entities/installment-purchase.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Budget,
      Profile,
      FinancialCategory,
      FinancialMovement,
      InstallmentPurchase,
    ]),
    NotificationsModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
