import api from './api';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  lastRun?: string;
  nextRun: string;
  active: boolean;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  profile?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringTransactionDto {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  startDate: string;
  endDate?: string;
  categoryId: string;
  profileId: string;
  reserveId?: string;
  skipPastRuns?: boolean;
}

export interface UpdateRecurringTransactionDto extends Partial<CreateRecurringTransactionDto> {
  active?: boolean;
}

export const recurringTransactionsService = {
  getAll: async (): Promise<RecurringTransaction[]> => {
    const response = await api.get<RecurringTransaction[]>('/recurring-transactions');
    return response.data;
  },

  getByProfile: async (profileId: string): Promise<RecurringTransaction[]> => {
    const response = await api.get<RecurringTransaction[]>(`/recurring-transactions/profile/${profileId}`);
    return response.data;
  },

  getById: async (id: string): Promise<RecurringTransaction> => {
    const response = await api.get<RecurringTransaction>(`/recurring-transactions/${id}`);
    return response.data;
  },

  create: async (data: CreateRecurringTransactionDto): Promise<RecurringTransaction> => {
    const response = await api.post<RecurringTransaction>('/recurring-transactions', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRecurringTransactionDto): Promise<RecurringTransaction> => {
    const response = await api.put<RecurringTransaction>(`/recurring-transactions/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/recurring-transactions/${id}`);
  },

  toggleActive: async (id: string, active: boolean): Promise<RecurringTransaction> => {
    const response = await api.put<RecurringTransaction>(`/recurring-transactions/${id}`, { active });
    return response.data;
  },
};
