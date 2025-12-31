import api from './api';

export interface Reserve {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  description?: string;
  color: string;
  autoSave: boolean;
  autoSaveAmount: number;
  autoSaveDay: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReserveDto {
  profileId: string;
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  description?: string;
  color?: string;
}

export interface UpdateReserveDto {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  description?: string;
  color?: string;
  autoSave?: boolean;
  autoSaveAmount?: number;
  autoSaveDay?: number;
}

export const reservesService = {
  create: async (data: CreateReserveDto): Promise<Reserve> => {
    const response = await api.post<Reserve>('/reserves', data);
    return response.data;
  },

  getAll: async (profileId?: string): Promise<Reserve[]> => {
    const storedProfileId = profileId || localStorage.getItem('profileId') || localStorage.getItem('userId');
    const response = await api.get<Reserve[]>('/reserves', {
      params: storedProfileId ? { profileId: storedProfileId } : {}
    });
    return response.data;
  },

  getById: async (id: string): Promise<Reserve> => {
    const response = await api.get<Reserve>(`/reserves/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateReserveDto): Promise<Reserve> => {
    const response = await api.patch<Reserve>(`/reserves/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/reserves/${id}`);
  },

  // Helper to add money to a reserve
  addToReserve: async (id: string, amount: number): Promise<Reserve> => {
    const reserve = await reservesService.getById(id);
    const newAmount = Number(reserve.currentAmount) + amount;
    return reservesService.update(id, { currentAmount: newAmount });
  },

  // Helper to withdraw money from a reserve
  withdrawFromReserve: async (id: string, amount: number): Promise<Reserve> => {
    const reserve = await reservesService.getById(id);
    const newAmount = Math.max(0, Number(reserve.currentAmount) - amount);
    return reservesService.update(id, { currentAmount: newAmount });
  },
};
