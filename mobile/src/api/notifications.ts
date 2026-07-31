import { normalizeData } from './normalize';
import { apiClient } from './axios';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Notification {
  id: string;
  category: string;
  event_type: string;
  title: string;
  message: string;
  context: Record<string, any>;
  resource_type: string;
  resource_id: string;
  status: string;
  created_at: string;
  read_at: string | null;
}

export interface NotificationPreference {
  id: string;
  category: string;
  channel: string;
  is_enabled: boolean;
}

export const notificationsApi = {
  getNotifications: async (offset = 0, limit = 20): Promise<PaginatedResponse<Notification>> => {
    const { data } = await apiClient.get<PaginatedResponse<Notification>>(`/notifications/?offset=${offset}&limit=${limit}`);
    return normalizeData(data);
  },
  
  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark-all-read/');
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{unread_count: number}>('/notifications/unread-count/');
    return data.unread_count;
  },

  archiveAll: async (): Promise<void> => {
    await apiClient.post('/notifications/archive-all/');
  },
  
  markAsRead: async (id: string): Promise<Notification> => {
    const { data } = await apiClient.post<Notification>(`/notifications/${id}/read/`);
    return normalizeData(data);
  },

  archive: async (id: string): Promise<Notification> => {
    const { data } = await apiClient.post<Notification>(`/notifications/${id}/archive/`);
    return normalizeData(data);
  },

  getPreferences: async (): Promise<NotificationPreference[]> => {
    const { data } = await apiClient.get<NotificationPreference[]>('/notifications/preferences/');
    return normalizeData(data);
  },

  updatePreference: async (id: string, is_enabled: boolean): Promise<NotificationPreference> => {
    const { data } = await apiClient.patch<NotificationPreference>(`/notifications/preferences/${id}/`, {
      is_enabled
    });
    return normalizeData(data);
  },
  
  createPreference: async (preference: Omit<NotificationPreference, 'id'>): Promise<NotificationPreference> => {
    const { data } = await apiClient.post<NotificationPreference>('/notifications/preferences/', preference);
    return normalizeData(data);
  }
};
