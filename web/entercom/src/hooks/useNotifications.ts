import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import type { Notification, NotificationPreference } from '../api/notifications';

export const NOTIFICATIONS_KEY = ['notifications'];
export const NOTIFICATIONS_PREFERENCES_KEY = ['notifications', 'preferences'];

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: notificationsApi.getNotifications,
    refetchInterval: 30000, // Poll every 30 seconds for now until WebSockets are integrated
  });

  const markAsRead = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old) => {
        if (!old) return [];
        return old.map(n => n.id === updatedNotification.id ? updatedNotification : n);
      });
    },
  });

  const archive = useMutation({
    mutationFn: notificationsApi.archive,
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old) => {
        if (!old) return [];
        return old.map(n => n.id === updatedNotification.id ? updatedNotification : n);
      });
    },
  });

  return {
    notifications: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    markAsRead,
    archive,
    unreadCount: (query.data || []).filter(n => !n.read_at).length
  };
}

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_PREFERENCES_KEY,
    queryFn: notificationsApi.getPreferences,
  });

  const updatePreference = useMutation({
    mutationFn: ({ id, is_enabled }: { id: string; is_enabled: boolean }) => 
      notificationsApi.updatePreference(id, is_enabled),
    onSuccess: (updatedPreference) => {
      queryClient.setQueryData<NotificationPreference[]>(NOTIFICATIONS_PREFERENCES_KEY, (old) => {
        if (!old) return [];
        return old.map(p => p.id === updatedPreference.id ? updatedPreference : p);
      });
    }
  });

  const createPreference = useMutation({
    mutationFn: (preference: Omit<NotificationPreference, 'id'>) => 
      notificationsApi.createPreference(preference),
    onSuccess: (newPreference) => {
      queryClient.setQueryData<NotificationPreference[]>(NOTIFICATIONS_PREFERENCES_KEY, (old) => {
        if (!old) return [newPreference];
        return [...old, newPreference];
      });
    }
  });

  return {
    preferences: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    updatePreference,
    createPreference
  };
}
