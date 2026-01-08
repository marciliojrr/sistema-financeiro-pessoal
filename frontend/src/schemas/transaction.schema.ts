import { z } from 'zod';

// Enums
export const MovementTypeSchema = z.enum(['income', 'expense', 'transfer_in', 'transfer_out']);
export const TransactionStatusSchema = z.enum(['planned', 'pending', 'completed', 'cancelled']);

// Transaction Schema
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
  amount: z.number(),
  date: z.string(),
  type: MovementTypeSchema,
  status: TransactionStatusSchema.optional(),
  categoryId: z.string().uuid().optional().nullable(),
  accountId: z.string().uuid().optional().nullable(),
  profileId: z.string().uuid().optional(),
  installmentPurchaseId: z.string().uuid().optional().nullable(),
});

export const TransactionArraySchema = z.array(TransactionSchema);

// Types derivados dos schemas
export type TransactionFromSchema = z.infer<typeof TransactionSchema>;
