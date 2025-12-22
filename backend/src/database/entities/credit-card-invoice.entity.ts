import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { CreditCard } from './credit-card.entity';
import { InstallmentItem } from './installment-item.entity';

@Entity('credit_card_invoices')
export class CreditCardInvoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    month: string; // Ex: '2025-09'

    @Column('decimal', { precision: 12, scale: 2 })
    totalAmount: number;

    @Column({ default: false, type: 'boolean' })
    paid: boolean;

    @ManyToOne(() => CreditCard, creditCard => creditCard.invoices)
    creditCard: CreditCard;

    @OneToMany(() => InstallmentItem, item => item.creditCardInvoice)
    installmentItems: InstallmentItem[];
}