import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@lib/queryKeys";
import { notificationService } from "../services/notificationService";

/**
 * Lightweight hook specifically for the notification badge
 * Separate from useNotifications to avoid fetching full notification list
 * just to show a count in the tab bar
 */
export function useUnreadCount() {
  const { data: count = 0, refetch } = useQuery({
    queryKey: queryKeys.notifications.unread(),
    queryFn: notificationService.getUnreadCount,
    staleTime: 60 * 1000, // Consider fresh for 1 minute
    refetchInterval: 60 * 1000, // Poll every minute for updates
    refetchOnWindowFocus: true, // Refresh when app comes to foreground
  });

  return {
    count,
    refetch,
    hasUnread: count > 0,
  };
}