import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Profile } from './profile.entity';
import { FinancialMovement } from './financial-movement.entity';

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  WALLET = 'WALLET',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  bank: string;

  @Column({
    type: 'enum',
    enum: AccountType,
    default: AccountType.CHECKING,
  })
  type: AccountType;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  initialBalance: number;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  profile: Profile;

  @OneToMany(() => FinancialMovement, (movement) => movement.account)
  financialMovements: FinancialMovement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
