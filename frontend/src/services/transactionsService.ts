import api from './api';

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
}

export interface CreateTransactionDto {
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  categoryId?: string;
  notes?: string;
  profileId: string;
}

export const transactionsService = {
  create: async (data: CreateTransactionDto, profileId?: string): Promise<Transaction> => {
    const response = await api.post<Transaction>('/financial-movements', data, {
        params: profileId ? { profileId } : {}
    });
    return response.data;
  },
};
