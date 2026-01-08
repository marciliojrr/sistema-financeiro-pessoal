/**
 * Status de uma transação/movimentação
 */
export enum TransactionStatus {
  PLANNED = 'planned',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
