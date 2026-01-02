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
  getReservesProgress: async (profileId?: string): Promise<{ name: string; current: number; target: number; percentage: number }[]> => {
    const params = profileId ? { profileId } : {};
    const response = await api.get('/reports/reserves-progress', { params });
    return response.data;
  },

  getFixedExpenses: async (month: number, year: number, profileId?: string): Promise<number> => {
    const params = { month, year, isFixed: 'true', ...(profileId ? { profileId } : {}) };
    const response = await api.get<{ amount: number }[]>('/reports/expenses-by-category', { params });
    // Aggregation might be needed if returns array of categories
    return response.data.reduce((acc, curr) => acc + curr.amount, 0);
  },

  getMonthlyEvolution: async (months: number = 6, profileId?: string): Promise<{ month: string; year: number; income: number; expense: number; balance: number }[]> => {
    const params = { months, ...(profileId ? { profileId } : {}) };
    const response = await api.get<{ month: string; year: number; income: number; expense: number; balance: number }[]>('/reports/monthly-evolution', { params });
    return response.data;
  },

  getBudgetPlanning: async (month: number, year: number, profileId?: string): Promise<{ category: string; planned: number; actual: number; percentage: number }[]> => {
    const params = { month, year, ...(profileId ? { profileId } : {}) };
    const response = await api.get<{ category: string; planned: number; actual: number; percentage: number }[]>('/reports/budget-planning', { params });
    return response.data;
  },
};
