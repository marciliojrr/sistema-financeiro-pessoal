import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CreditCard } from './credit-card.entity';
// Import financial movement later to avoid circular dependency issues if possible, 
// or use forwardRef/string relations if needed. For now assuming Installments are linked via FinancialMovement or dedicated Installment entity.
// Plan says "installments (OneToMany - new relation on financial movements)". 
// Let's import FinancialMovement.
import { FinancialMovement } from './financial-movement.entity';

export enum InvoiceStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PAID = 'PAID',
}

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CreditCard, (card) => card.invoices, { onDelete: 'CASCADE' })
  card: CreditCard;

  @Column()
  month: string; // "1" to "12" or "JAN", "FEB" etc. Let's use numeric string "01"-"12" or just integer. Let's use string "01".."12".

  @Column()
  year: number; // e.g. 2024

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({
    type: 'simple-enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.OPEN,
  })
  status: InvoiceStatus;

  @Column({ type: 'date' })
  dueDate: string; // YYYY-MM-DD

  @Column({ type: 'date' })
  closingDate: string; // YYYY-MM-DD - limit date for transactions to enter this invoice

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // We need to link FinancialMovements (which represent expenses/installments) to this Invoice.
  // One Invoice has Many Movements (Installments).
  @OneToMany(() => FinancialMovement, (movement) => movement.invoice)
  financialMovements: FinancialMovement[];
}
