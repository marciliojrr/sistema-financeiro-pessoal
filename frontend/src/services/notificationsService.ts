import api from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'BUDGET_ALERT' | 'DEBT_DUE' | 'RESERVE_GOAL' | 'SYSTEM' | string;
  createdAt: string;
}

export const notificationsService = {
  getAll: async (read?: boolean): Promise<Notification[]> => {
    const params: Record<string, string> = {};
    if (read !== undefined) {
      params.read = String(read);
    }
    const response = await api.get<Notification[]>('/notifications', { params });
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.patch<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>('/notifications/read-all');
    return response.data;
  },

  // Helper to get unread count
  getUnreadCount: async (): Promise<number> => {
    const notifications = await notificationsService.getAll(false);
    return notifications.length;
  },
};
