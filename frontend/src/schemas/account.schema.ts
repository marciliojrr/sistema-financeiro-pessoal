import { z } from 'zod';

// Enums
export const AccountTypeSchema = z.enum(['CHECKING', 'SAVINGS', 'WALLET']);

// Account Schema
export const AccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: AccountTypeSchema,
  balance: z.number(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const AccountArraySchema = z.array(AccountSchema);

// Account Balance Schema
export const AccountBalanceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: AccountTypeSchema,
  initialBalance: z.number(),
  currentBalance: z.number(),
});

// Total Balance Schema
export const TotalBalanceSchema = z.object({
  totalBalance: z.number(),
  accounts: z.array(AccountBalanceSchema),
});

// Types derivados dos schemas
export type AccountFromSchema = z.infer<typeof AccountSchema>;
export type TotalBalanceFromSchema = z.infer<typeof TotalBalanceSchema>;
