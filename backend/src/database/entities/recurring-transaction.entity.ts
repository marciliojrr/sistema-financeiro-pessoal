import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { FinancialCategory } from './financial-category.entity';
import { MovementType } from './financial-movement.entity';
import { Reserve } from './reserve.entity';
import { FinancialScenario } from './financial-scenario.entity';

export enum RecurrenceFrequency {
  MONTHLY = 'MONTHLY',
  WEEKLY = 'WEEKLY',
  YEARLY = 'YEARLY',
}

@Entity('recurring_transactions')
export class RecurringTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: MovementType,
  })
  type: MovementType;

  @Column({
    type: 'enum',
    enum: RecurrenceFrequency,
    default: RecurrenceFrequency.MONTHLY,
  })
  frequency: RecurrenceFrequency;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({ type: 'date', nullable: true })
  lastRun: string;

  @Column({ type: 'date' })
  nextRun: string;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  profile: Profile;

  @ManyToOne(() => FinancialCategory, { onDelete: 'SET NULL', nullable: true })
  category: FinancialCategory;

  @ManyToOne(() => Reserve, { onDelete: 'SET NULL', nullable: true })
  reserve: Reserve;

  @ManyToOne(() => FinancialScenario, { onDelete: 'CASCADE', nullable: true })
  scenario: FinancialScenario;

  @Column({ nullable: true })
  scenarioId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
