import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { FinancialMovement } from './financial-movement.entity';
import { Budget } from './budget.entity';

@Entity()
export class FinancialCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @ManyToOne(() => Profile, (profile) => profile.categories, {
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  isFixed: boolean;

  // Keywords for auto-categorization (comma-separated)
  @Column({ nullable: true, type: 'text' })
  keywords: string;

  @OneToMany(() => FinancialMovement, (movement) => movement.category)
  financialMovements: FinancialMovement[];

  @OneToMany(() => Budget, (budget) => budget.category)
  budgets: Budget[];

  @DeleteDateColumn()
  deletedAt?: Date;
}

