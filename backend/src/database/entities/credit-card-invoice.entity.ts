import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { CreditCard } from './credit-card.entity';
import { InstallmentPurchase } from './installment-purchase.entity';

@Entity('credit_card_invoices')
export class CreditCardInvoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    month: number; // Ex: '2025-09'

    @Column('decimal', { precision: 12, scale: 2 })
    totalAmount: number;

    @Column({ default: false, type: 'boolean' })
    paid: boolean;

    @ManyToOne(() => CreditCard, creditCard => creditCard.invoices)
    creditCard: CreditCard;

    @OneToMany(() => InstallmentPurchase, purchase => purchase.invoices, { nullable: true })
    purchase: InstallmentPurchase;
}