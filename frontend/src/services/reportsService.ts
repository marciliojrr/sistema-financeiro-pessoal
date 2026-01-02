import api from './api';

export const reportsService = {
  exportCsv: async (profileId?: string): Promise<Blob> => {
    const params = profileId ? { profileId } : {};
    const response = await api.get('/reports/export/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  getDashboardSummary: async (profileId?: string) => {
    const params = profileId ? { profileId } : {};
    const response = await api.get('/reports/dashboard-summary', { params });
    return response.data;
  },

  getMonthlyBalance: async (month: number, year: number, profileId?: string) => {
    const params: Record<string, unknown> = { month, year };
    if (profileId) params.profileId = profileId;
    const response = await api.get('/reports/monthly-balance', { params });
    return response.data;
  },

  getExpensesByCategory: async (month: number, year: number, profileId?: string) => {
    const params: Record<string, unknown> = { month, year };
    if (profileId) params.profileId = profileId;
    const response = await api.get('/reports/expenses-by-category', { params });
    return response.data;
  },

  getBudgetPlanning: async (month: number, year: number, profileId?: string) => {
    const params: Record<string, unknown> = { month, year };
    if (profileId) params.profileId = profileId;
    const response = await api.get('/reports/budget-planning', { params });
    return response.data;
  },

  getReservesProgress: async (profileId?: string) => {
    const params = profileId ? { profileId } : {};
    const response = await api.get('/reports/reserves-progress', { params });
    return response.data;
  },

  getMonthlyEvolution: async (months?: number, profileId?: string) => {
    const params: Record<string, unknown> = { months: months || 6 };
    if (profileId) params.profileId = profileId;
    const response = await api.get('/reports/monthly-evolution', { params });
    return response.data;
  },
};
