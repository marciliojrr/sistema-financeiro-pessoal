import api from './api';

export interface Debt {
  id: string;
  description: string;
  totalAmount: number; // Valor Total da Dívida
  totalInstallments: number;
  paidInstallments: number; // Computed?
  outstandingAmount: number; // Computed?
  startDate: string;
  dueDateDay: number;
  profileId: string;
  categoryId?: string;
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
  }
};
