import api from './api';

export interface Debt {
  id: string;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  remainingAmount: number;
  outstandingAmount: number;
  startDate: string;
  dueDateDay: number;
  profileId: string;
  categoryId?: string;
  active?: boolean;
  interestRate?: number;
}

export interface CreateDebtDto {
  description: string;
  totalAmount: number;
  totalInstallments: number;
  startDate: string;
  dueDateDay: number;
  profileId: string;
  categoryId?: string;
}

export const debtsService = {
  getAll: async () => {
    const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');
    // Backend controller accepts query: { profileId }
    const response = await api.get<Debt[]>('/debts', { params: { profileId } });
    return response.data;
  },

  create: async (data: CreateDebtDto) => {
    const response = await api.post<Debt>('/debts', data);
    return response.data;
  },

  delete: async (id: string) => {
    const profileId = localStorage.getItem('profileId') || localStorage.getItem('userId');
    await api.delete(`/debts/${id}`, { params: { profileId } });
  },

  getOne: async (id: string) => {
    const response = await api.get<Debt>(`/debts/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateDebtDto>) => {
    const response = await api.patch<Debt>(`/debts/${id}`, data);
    return response.data;
  }
};
