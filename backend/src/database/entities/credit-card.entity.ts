import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { InstallmentPurchase } from './installment-purchase.entity';
import { CreditCardInvoice } from './credit-card-invoice.entity';
//import { InstallmentPurchase } from './installment-purchase.entity';
//import { CreditCardInvoice } from './credit-card-invoice.entity';

@Entity('credit_cards')
export class CreditCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cardName: string;

  @Column()
  bank: string;

  @Column()
  cardNumber: string;

  @Column('decimal', { precision: 12, scale: 2 })
  limit: number;

  @Column({ type: 'int', default: 1 })
  closingDay: number;

  @Column({ type: 'int', default: 10 })
  dueDay: number;

  @ManyToOne(() => Profile, (profile) => profile.creditCards, {
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @OneToMany(() => InstallmentPurchase, (purchase) => purchase.creditCard)
  purchases: InstallmentPurchase[];

  @OneToMany(() => CreditCardInvoice, (invoice) => invoice.creditCard)
  invoices: CreditCardInvoice[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
