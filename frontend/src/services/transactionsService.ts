import api from './api';

// Status enum para transações
export enum TransactionStatus {
  PLANNED = 'planned',
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId?: string;
  isPaid: boolean;
  paymentDate?: string;
  profileId?: string;
  installmentPurchaseId?: string | null;
  accountId?: string;
  status?: TransactionStatus;
}

export interface CreateTransactionDto {
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  categoryId?: string;
  notes?: string;
  profileId: string;
  accountId?: string;
  status?: TransactionStatus;
}

export const transactionsService = {
  create: async (data: CreateTransactionDto): Promise<Transaction> => {
    const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');
    const response = await api.post<Transaction>('/financial-movements', data, {
        params: profileId ? { profileId } : {}
    });
    return response.data;
  },

  getAll: async (filters?: Record<string, unknown>): Promise<Transaction[]> => {
    const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');
    const response = await api.get<Transaction[]>('/financial-movements', {
        params: { ...filters, profileId }
    });
    return response.data;
  },

  getById: async (id: string): Promise<Transaction> => {
    const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');
    const response = await api.get<Transaction>(`/financial-movements/${id}`, {
        params: { profileId }
    });
    return response.data;
  },

  update: async (id: string, data: Partial<CreateTransactionDto>): Promise<Transaction> => {
    const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');
    const response = await api.patch<Transaction>(`/financial-movements/${id}`, data, {
        params: { profileId }
    });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');
    await api.delete(`/financial-movements/${id}`, {
        params: { profileId }
    });
  },
};
