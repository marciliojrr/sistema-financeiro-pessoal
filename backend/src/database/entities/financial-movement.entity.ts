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
import { FinancialScenario } from './financial-scenario.entity';
import { Debt } from './debt.entity';

export enum MovementType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

@Entity('financial_movements')
export class FinancialMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  notes?: string;

  @ManyToOne(() => Profile, (profile) => profile.financialMovements, {
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @ManyToOne(() => FinancialCategory, (category) => category.financialMovements)
  category: FinancialCategory;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @ManyToOne(() => FinancialScenario, (scenario) => scenario.movements, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  scenario: FinancialScenario;

  @Column({ nullable: true })
  scenarioId: string;

  // Relação com Dívida (se for um pagamento de dívida)
  @ManyToOne(() => Debt, { nullable: true, onDelete: 'SET NULL' })
  debt: Debt;

  @Column({ nullable: true })
  debtId: string;
}
