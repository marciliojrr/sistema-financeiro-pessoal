import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { CreditCard } from './credit-card.entity';
import { InstallmentItem } from './installment-item.entity';

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

  @Column({ type: 'date' })
  purchaseDate: Date;

  @ManyToOne(() => CreditCard, creditCard => creditCard.purchases)
  creditCard: CreditCard;

  // MUDANÇA: Relacionamento com as parcelas individuais
  @OneToMany(() => InstallmentItem, item => item.installmentPurchase)
  installmentItems: InstallmentItem[];
}
