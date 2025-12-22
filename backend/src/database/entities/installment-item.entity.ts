import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { InstallmentPurchase } from './installment-purchase.entity';
import { CreditCardInvoice } from './credit-card-invoice.entity';

@Entity('installment_items')
export class InstallmentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  installmentNumber: number; // Número da parcela

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number; // Valor da parcela individual

  @Column({ type: 'date' })
  dueDate: Date; // Data de vencimento da parcela

  @Column({ default: false })
  paid: boolean; // Se a parcela foi paga

  @ManyToOne(() => InstallmentPurchase, (purchase) => purchase.installmentItems)
  installmentPurchase: InstallmentPurchase;

  @ManyToOne(() => CreditCardInvoice, (invoice) => invoice.installmentItems, {
    nullable: true,
  })
  creditCardInvoice: CreditCardInvoice;
}
