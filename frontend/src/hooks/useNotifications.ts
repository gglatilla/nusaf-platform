import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Polls unread notification count every 30 seconds for the bell badge.
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notificationUnreadCount'],
    queryFn: async () => {
      const response = await api.getUnreadNotificationCount();
      return response.data?.count ?? 0;
    },
    refetchInterval: 30000,
  });
}

/**
 * Fetches notification list on demand (when dropdown is opened).
 */
export function useNotifications(options: { enabled: boolean; page?: number }) {
  return useQuery({
    queryKey: ['notifications', options.page ?? 1],
    queryFn: async () => {
      const response = await api.getNotifications({
        page: options.page ?? 1,
        pageSize: 20,
      });
      return response.data;
    },
    enabled: options.enabled,
  });
}

/**
 * Mark a single notification as read.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.markNotificationRead(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Mark all notifications as read.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.markAllNotificationsRead();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * Delete a single notification.
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.deleteNotification(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationUnreadCount'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
