import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditCard } from '../database/entities/credit-card.entity';
import { InstallmentPurchase } from '../database/entities/installment-purchase.entity';
import { CreditCardInvoice } from '../database/entities/credit-card-invoice.entity';
import { CreditCardsService } from './credit-cards.service';
import { CreditCardController } from './credit-cards.controller';
import { InstallmentItem } from 'src/database/entities/installment-item.entity';
import { Profile } from 'src/database/entities/profile.entity';
import { FinancialMovement } from 'src/database/entities/financial-movement.entity';
import { FinancialMovementsModule } from '../financial-movements/financial-movements.module';
import { BudgetsModule } from '../budgets/budgets.module';
import { FinancialCategory } from 'src/database/entities/financial-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreditCard,
      InstallmentPurchase,
      CreditCardInvoice,
      InstallmentItem,
      FinancialMovement,
      Profile,
      FinancialCategory,
    ]),
    FinancialMovementsModule,
    BudgetsModule,
  ],
  providers: [CreditCardsService],
  controllers: [CreditCardController],
  exports: [CreditCardsService],
})
export class CreditCardsModule {}
