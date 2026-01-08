import { z } from 'zod';

// Enums
export const CategoryTypeSchema = z.enum(['INCOME', 'EXPENSE']);
export const IncomeSourceSchema = z.enum(['SALARY', 'SCHOLARSHIP', 'FREELANCE', 'INVESTMENT', 'OTHER']);

// Category Schema
export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: CategoryTypeSchema,
  isFixed: z.boolean(),
  keywords: z.string().optional(),
  incomeSource: IncomeSourceSchema.optional(),
  active: z.boolean().optional(),
});

export const CategoryArraySchema = z.array(CategorySchema);

// Types derivados dos schemas
export type CategoryFromSchema = z.infer<typeof CategorySchema>;
