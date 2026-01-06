import api from './api';

export enum IncomeSource {
  SALARY = 'SALARY',
  SCHOLARSHIP = 'SCHOLARSHIP',
  FREELANCE = 'FREELANCE',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER',
}

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  isFixed: boolean;
  keywords?: string;
  incomeSource?: IncomeSource;
}

interface SuggestResponse {
  suggested: boolean;
  category?: Category;
}

export const categoriesService = {
  getAll: async (profileId?: string): Promise<Category[]> => {
    const params = profileId ? { profileId } : {};
    const response = await api.get<Category[]>('/categories', { params });
    return response.data;
  },
  
  create: async (data: Omit<Category, 'id'>, profileId?: string): Promise<Category> => {
    const payload = { ...data, profileId };
    const response = await api.post<Category>('/categories', payload);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Category, 'id'>>): Promise<Category> => {
    const response = await api.patch<Category>(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  suggest: async (description: string, profileId: string): Promise<SuggestResponse> => {
    const response = await api.get<SuggestResponse>('/categories/suggest', {
      params: { description, profileId },
    });
    return response.data;
  },
};

// Type alias for backward compatibility
export type FinancialCategory = Category;
