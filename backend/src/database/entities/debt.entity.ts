import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { FinancialCategory } from './financial-category.entity';

@Entity('debts')
export class Debt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, (profile) => profile.debts, { onDelete: 'CASCADE' })
  profile: Profile;

  @ManyToOne(() => FinancialCategory, { nullable: true })
  category: FinancialCategory;

  @Column({ length: 255 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  remainingAmount: number;

  @Column({ type: 'int' })
  totalInstallments: number;

  @Column({ type: 'int', default: 0 })
  paidInstallments: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'int' })
  dueDateDay: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  interestRate: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
