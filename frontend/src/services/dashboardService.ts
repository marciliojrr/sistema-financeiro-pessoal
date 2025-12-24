import api from './api';

export interface DashboardSummary {
  balance: {
    month: number;
    year: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  unreadNotifications: number;
  upcomingBills: {
    description: string;
    amount: number;
    date: string;
    category?: string;
  }[];
  currentMonth: number;
  currentYear: number;
}

export const dashboardService = {
  getSummary: async (profileId?: string): Promise<DashboardSummary> => {
    // If profileId is passed, include it in params
    const params = profileId ? { profileId } : {};
    const response = await api.get<DashboardSummary>('/reports/dashboard-summary', { params });
    return response.data;
  },

  getExpensesByCategory: async (month: number, year: number, profileId?: string): Promise<{ category: string; amount: number }[]> => {
    const params = { month, year, ...(profileId ? { profileId } : {}) };
    const response = await api.get<{ category: string; amount: number }[]>('/reports/expenses-by-category', { params });
    return response.data;
  },
};
