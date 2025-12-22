import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { CreditCard } from './credit-card.entity';
import { InstallmentItem } from './installment-item.entity';
import { FinancialCategory } from './financial-category.entity';

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

  @ManyToOne(() => CreditCard, (creditCard) => creditCard.purchases)
  creditCard: CreditCard;

  @ManyToOne(() => FinancialCategory, { nullable: true })
  category: FinancialCategory;

  // MUDANÇA: Relacionamento com as parcelas individuais
  @OneToMany(() => InstallmentItem, (item) => item.installmentPurchase)
  installmentItems: InstallmentItem[];

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt?: Date;
}
