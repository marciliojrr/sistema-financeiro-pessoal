import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditCard } from '../database/entities/credit-card.entity';
import { InstallmentPurchase } from '../database/entities/installment-purchase.entity';
import { CreditCardInvoice } from '../database/entities/credit-card-invoice.entity';
import { CreditCardsService } from './credit-cards.service';
import { CreditCardController } from './credit-cards.controller';
import { InstallmentItem } from 'src/database/entities/installment-item.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        CreditCard, 
        InstallmentPurchase, 
        CreditCardInvoice,
        InstallmentItem
    ])],
    providers: [CreditCardsService],
    controllers: [CreditCardController],
    exports: [CreditCardsService]
}) 

export class CreditCardsModule {}
