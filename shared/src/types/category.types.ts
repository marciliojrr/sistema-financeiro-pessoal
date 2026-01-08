import { CategoryType } from '../enums/category-type.enum';
import { IncomeSource } from '../enums/income-source.enum';

/**
 * Categoria financeira
 */
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  isFixed: boolean;
  keywords?: string;
  incomeSource?: IncomeSource;
  active?: boolean;
}

export type CreateCategoryDto = Omit<Category, 'id'>;
export type UpdateCategoryDto = Partial<CreateCategoryDto>;
