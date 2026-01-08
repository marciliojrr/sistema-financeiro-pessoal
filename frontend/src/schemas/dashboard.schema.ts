import { z } from 'zod';

// Dashboard Balance Schema
export const DashboardBalanceSchema = z.object({
  month: z.number(),
  year: z.number(),
  totalIncome: z.number(),
  totalExpense: z.number(),
  balance: z.number(),
});

// Upcoming Bill Schema
export const UpcomingBillSchema = z.object({
  description: z.string(),
  amount: z.number(),
  date: z.string(),
  category: z.string().optional(),
  type: z.enum(['RECURRING', 'MANUAL']).optional(),
});

// Dashboard Summary Schema
export const DashboardSummarySchema = z.object({
  balance: DashboardBalanceSchema,
  unreadNotifications: z.number(),
  upcomingBills: z.array(UpcomingBillSchema),
  currentMonth: z.number(),
  currentYear: z.number(),
});

// Types derivados dos schemas
export type DashboardSummaryFromSchema = z.infer<typeof DashboardSummarySchema>;
export type DashboardBalanceFromSchema = z.infer<typeof DashboardBalanceSchema>;
