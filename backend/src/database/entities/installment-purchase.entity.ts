import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { CreditCard } from './credit-card.entity';
import { FinancialMovement } from './financial-movement.entity';
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

  // MUDANÇA: Relacionamento com as parcelas individuais (agora via FinancialMovement)
  @OneToMany(() => FinancialMovement, (movement) => movement.installmentPurchase)
  movements: FinancialMovement[];

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt?: Date;
}
