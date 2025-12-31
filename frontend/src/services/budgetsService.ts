import api from './api';

export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  categoryId: string; // Required for setup, though backend allows optional? DTO says categoryId optional but Logic implies we set budget per category usually.
  category?: {
    id: string;
    name: string;
  };
  profileId: string;
}

export interface CreateBudgetDto {
  amount: number;
  month: number;
  year: number;
  categoryId?: string; // If global budget? Usually category specific.
  profileId: string;
}

export interface BudgetPlanningItem {
  budget: number;
  category: string;
  actual: number;
  remaining: number;
  alertThreshold: number;
}

export const budgetsService = {
  // CRUD
  create: async (data: CreateBudgetDto) => {
    const response = await api.post<Budget>('/budgets', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateBudgetDto>) => {
    const response = await api.patch<Budget>(`/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/budgets/${id}`);
  },

  // Reports / Planning View
  getPlanning: async (month: number, year: number, profileId?: string): Promise<BudgetPlanningItem[]> => {
     const params = { month, year, ...(profileId ? { profileId } : {}) };
     const response = await api.get<BudgetPlanningItem[]>('/reports/budget-planning', { params });
     return response.data;
  }
};
