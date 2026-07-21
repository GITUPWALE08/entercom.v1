import { ensureArray } from '../utils/arrays';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import type { Notification, NotificationPreference } from '../api/notifications';

export const NOTIFICATIONS_KEY = ['notifications'];
export const NOTIFICATIONS_PREFERENCES_KEY = ['notifications', 'preferences'];

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: ({ pageParam = 0 }) => notificationsApi.getNotifications(pageParam, 20),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.next) {
        return allPages.length * 20;
      }
      return undefined;
    },
  });

  const notifications = query.data?.pages.flatMap(p => ensureArray(p)) || [];

  const unreadCountQuery = useQuery({
    queryKey: [...NOTIFICATIONS_KEY, 'unreadCount'],
    queryFn: notificationsApi.getUnreadCount,
  });

  const markAsRead = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData(NOTIFICATIONS_KEY, (data: any) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page: any) => {
            const newPage = ensureArray(page).map((n: Notification) => 
              n.id === updatedNotification.id ? updatedNotification : n
            ) as any;
            newPage.next = page.next;
            newPage.count = page.count;
            newPage.previous = page.previous;
            return newPage;
          })
        };
      });
    },
  });

  const archive = useMutation({
    mutationFn: notificationsApi.archive,
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData(NOTIFICATIONS_KEY, (data: any) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page: any) => {
            const newPage = ensureArray(page).map((n: Notification) => 
              n.id === updatedNotification.id ? updatedNotification : n
            ) as any;
            newPage.next = page.next;
            newPage.count = page.count;
            newPage.previous = page.previous;
            return newPage;
          })
        };
      });
    },
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_KEY, 'unreadCount'] });
    },
  });

  const archiveAll = useMutation({
    mutationFn: notificationsApi.archiveAll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_KEY, 'unreadCount'] });
    },
  });

  return {
    notifications,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    markAsRead,
    archive,
    markAllRead,
    archiveAll,
    unreadCount: unreadCountQuery.data ?? ensureArray(notifications).filter(n => !n.read_at).length
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
