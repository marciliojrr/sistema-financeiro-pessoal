import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { CreditCard } from './credit-card.entity';
import { CreditCardInvoice } from './credit-card-invoice.entity';

@Entity('installment_purchases')
export class InstallmentPurchase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    productName: string;

    @Column('decimal', { precision: 12, scale: 2 })
    totalValue: number;

    @Column()
    installments: number;

    @Column()
    purchaseDate: Date;

    @ManyToOne(() => CreditCard, creditCard => creditCard.purchases)
    creditCard: CreditCard;

    @OneToMany(() => CreditCardInvoice, invoice => invoice.purchase)
    invoices: CreditCardInvoice[];
}