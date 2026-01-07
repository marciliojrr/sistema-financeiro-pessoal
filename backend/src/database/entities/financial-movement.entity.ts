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
import { Invoice } from './invoice.entity';
import { InstallmentPurchase } from './installment-purchase.entity';
import { Account } from './account.entity';

export enum MovementType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
}

export enum TransactionStatus {
  PLANNED = 'planned', // Transação futura, não confirmada
  PENDING = 'pending', // Aguardando pagamento/recebimento
  COMPLETED = 'completed', // Efetivada
  CANCELLED = 'cancelled', // Cancelada
}

@Entity('financial_movements')
export class FinancialMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'date' })
  date: Date;

  @Column({ nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @ManyToOne(() => Profile, (profile) => profile.financialMovements, {
    onDelete: 'CASCADE',
  })
  profile: Profile;

  @ManyToOne(
    () => FinancialCategory,
    (category) => category.financialMovements,
    {
      nullable: true,
    },
  )
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

  @ManyToOne(() => Invoice, (invoice) => invoice.financialMovements, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  invoice: Invoice;

  @Column({ nullable: true })
  invoiceId: string;

  @ManyToOne(() => InstallmentPurchase, (purchase) => purchase.movements, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  installmentPurchase: InstallmentPurchase;

  @Column({ nullable: true })
  installmentPurchaseId: string;

  @ManyToOne(() => Account, (account) => account.financialMovements, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  account: Account;

  @Column({ nullable: true })
  accountId: string;
}
