import { MovementType } from '../enums/movement-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

/**
 * Movimentação/Transação financeira
 */
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: MovementType;
  status: TransactionStatus;
  categoryId?: string;
  accountId?: string;
  profileId?: string;
  installmentPurchaseId?: string | null;
}

export interface CreateTransactionDto {
  description: string;
  amount: number;
  date: string;
  type: MovementType;
  status?: TransactionStatus;
  categoryId?: string;
  accountId?: string;
  profileId: string;
  notes?: string;
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>;
