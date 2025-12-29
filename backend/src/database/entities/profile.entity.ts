import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Budget } from './budget.entity';
import { FinancialCategory } from './financial-category.entity';
import { FinancialMovement } from './financial-movement.entity';
import { CreditCard } from './credit-card.entity';
import { Debt } from './debt.entity';
import { Notification } from './notification.entity';
import { Reserve } from './reserve.entity';
import { FinancialScenario } from './financial-scenario.entity';

export enum ProfileRole {
  ADMIN = 'admin', // Controle total: criar, editar, excluir
  EDITOR = 'editor', // Pode editar mas não excluir
  VIEWER = 'viewer', // Apenas visualização
}

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    default: ProfileRole.ADMIN,
  })
  role: ProfileRole;

  @Column()
  active: boolean;

  @ManyToOne(() => User, (user) => user.profiles, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => FinancialCategory, (category) => category.profile)
  categories: FinancialCategory[];

  @OneToMany(() => FinancialMovement, (movement) => movement.profile)
  financialMovements: FinancialMovement[];

  @OneToMany(() => CreditCard, (creditCard) => creditCard.profile)
  creditCards: CreditCard[];

  @OneToMany(() => Budget, (budget) => budget.profile)
  budgets: Budget[];

  @OneToMany(() => Debt, (debt) => debt.profile)
  debts: Debt[];

  @OneToMany(() => Notification, (notification) => notification.profile)
  notifications: Notification[];

  @OneToMany(() => Reserve, (reserve) => reserve.profile)
  reserves: Reserve[];

  @OneToMany(() => FinancialScenario, (scenario) => scenario.profile)
  scenarios: FinancialScenario[];

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt?: Date;
}
