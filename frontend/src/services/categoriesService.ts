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
    const payload = { ...data, profileId };
    const response = await api.post<Category>('/categories', payload);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Category, 'id'>>, profileId?: string): Promise<Category> => {
    // Assuming backend might check profileId for permission or it's just payload. 
    // If backend uses profileId from User object in Request, passing in body might be ignored or used for cross-check.
    // However, create failed because DTO required it. UpdateDTO usually makes fields optional.
    const response = await api.patch<Category>(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string, profileId?: string): Promise<void> => {
    await api.delete(`/categories/${id}`, {
        params: profileId ? { profileId } : {}
    });
  }
};

