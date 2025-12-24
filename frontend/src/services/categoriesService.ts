import api from './api';

export interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  isFixed: boolean;
}

export const categoriesService = {
  getAll: async (profileId?: string): Promise<Category[]> => {
    const params = profileId ? { profileId } : {};
    const response = await api.get<Category[]>('/categories', { params });
    return response.data;
  },
  
  create: async (data: Omit<Category, 'id'>, profileId?: string): Promise<Category> => {
    const response = await api.post<Category>('/categories', data, {
        params: profileId ? { profileId } : {}
    });
    return response.data;
  }
};
