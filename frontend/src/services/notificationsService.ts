import api from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'BUDGET_ALERT' | 'DEBT_DUE' | 'RESERVE_GOAL' | 'SYSTEM' | string;
  createdAt: string;
}

export interface CreateNotificationDto {
  profileId: string;
  title: string;
  message: string;
  type: string;
}

export interface UpdateNotificationDto {
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
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

  create: async (dto: CreateNotificationDto): Promise<Notification> => {
    const response = await api.post<Notification>('/notifications', dto);
    return response.data;
  },

  update: async (id: string, dto: UpdateNotificationDto): Promise<Notification> => {
    const response = await api.patch<Notification>(`/notifications/${id}`, dto);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/notifications/${id}`);
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

  getUnreadCount: async (): Promise<number> => {
    const notifications = await notificationsService.getAll(false);
    return notifications.length;
  },
};
