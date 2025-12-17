import { useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { queryKeys } from "@lib/queryKeys";
import { notificationService } from "../services/notificationService";
import type { Notification, GroupedNotifications } from "../types";

/**
 * Groups notifications by time section
 * - Unread always go to "new" section
 * - Read notifications go to time-based sections
 */
function groupNotificationsByTime(
  notifications: Notification[]
): GroupedNotifications {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Get start of week (Sunday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  const groups: GroupedNotifications = {
    new: [],
    today: [],
    yesterday: [],
    earlier_this_week: [],
    earlier: [],
  };

  notifications.forEach((notification) => {
    // Unread notifications always go to "new"
    if (!notification.isRead) {
      groups.new.push(notification);
      return;
    }

    // Read notifications go to time-based sections
    const createdAt = new Date(notification.createdAt);
    const notificationDate = new Date(
      createdAt.getFullYear(),
      createdAt.getMonth(),
      createdAt.getDate()
    );

    if (notificationDate.getTime() === today.getTime()) {
      groups.today.push(notification);
    } else if (notificationDate.getTime() === yesterday.getTime()) {
      groups.yesterday.push(notification);
    } else if (notificationDate >= startOfWeek) {
      groups.earlier_this_week.push(notification);
    } else {
      groups.earlier.push(notification);
    }
  });

  return groups;
}

/**
 * Get section display title
 */
export function getSectionTitle(
  section: keyof GroupedNotifications,
  count: number
): string {
  const titles: Record<keyof GroupedNotifications, string> = {
    new: "New",
    today: "Today",
    yesterday: "Yesterday",
    earlier_this_week: "Earlier this week",
    earlier: "Earlier",
  };

  return `${titles[section]} (${count})`;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  // Fetch all notifications
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: notificationService.getNotifications,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
  });

  // Group notifications by time
  const groupedNotifications = useMemo(
    () => groupNotificationsByTime(notifications),
    [notifications]
  );

  // Check if there are any notifications
  const hasNotifications = notifications.length > 0;

  // Unread count (for local use, badge uses separate query)
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // Mark single as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.all
      );

      // Optimistically update
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.all,
        (old) =>
          old?.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ) ?? []
      );

      // Also update unread count
      queryClient.setQueryData<number>(
        queryKeys.notifications.unread(),
        (old) => Math.max(0, (old ?? 0) - 1)
      );

      return { previousNotifications };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.all,
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread(),
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.all
      );

      // Optimistically mark all as read
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.all,
        (old) => old?.map((n) => ({ ...n, isRead: true })) ?? []
      );

      queryClient.setQueryData<number>(
        queryKeys.notifications.unread(),
        0
      );

      return { previousNotifications };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.all,
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread(),
      });
    },
  });

  // Delete single notification mutation
  const deleteMutation = useMutation({
    mutationFn: notificationService.deleteNotification,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.all
      );

      // Find the notification to check if unread
      const notification = previousNotifications?.find(
        (n) => n.id === notificationId
      );

      // Optimistically remove
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.all,
        (old) => old?.filter((n) => n.id !== notificationId) ?? []
      );

      // Update unread count if notification was unread
      if (notification && !notification.isRead) {
        queryClient.setQueryData<number>(
          queryKeys.notifications.unread(),
          (old) => Math.max(0, (old ?? 0) - 1)
        );
      }

      return { previousNotifications };
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.all,
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread(),
      });
    },
  });

  // Delete all (Clear All) mutation
  const deleteAllMutation = useMutation({
    mutationFn: notificationService.deleteAllNotifications,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.all
      );

      // Optimistically clear all
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.all,
        []
      );

      queryClient.setQueryData<number>(
        queryKeys.notifications.unread(),
        0
      );

      return { previousNotifications };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.all,
          context.previousNotifications
        );
      }
      Alert.alert("Error", "Failed to clear notifications. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread(),
      });
    },
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: notificationService.acceptInvitation,
    onSuccess: (_data, notificationId) => {
      // Remove the notification from cache
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.all,
        (old) => old?.filter((n) => n.id !== notificationId) ?? []
      );
      
      // Invalidate dishlist queries to show new collaboration
      queryClient.invalidateQueries({
        queryKey: queryKeys.dishLists.all,
      });
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to accept invitation."
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread(),
      });
    },
  });

  // Decline invitation mutation
  const declineInvitationMutation = useMutation({
    mutationFn: notificationService.declineInvitation,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.all,
      });

      const previousNotifications = queryClient.getQueryData<Notification[]>(
        queryKeys.notifications.all
      );

      // Optimistically remove
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.all,
        (old) => old?.filter((n) => n.id !== notificationId) ?? []
      );

      return { previousNotifications };
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKeys.notifications.all,
          context.previousNotifications
        );
      }
      Alert.alert("Error", "Failed to decline invitation.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unread(),
      });
    },
  });

  // Wrapped handlers
  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      markAsReadMutation.mutate(notificationId);
    },
    [markAsReadMutation]
  );

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  const handleDelete = useCallback(
    (notificationId: string) => {
      deleteMutation.mutate(notificationId);
    },
    [deleteMutation]
  );

  const handleClearAll = useCallback(() => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => deleteAllMutation.mutate(),
        },
      ]
    );
  }, [deleteAllMutation]);

  const handleAcceptInvitation = useCallback(
    (notificationId: string) => {
      return acceptInvitationMutation.mutateAsync(notificationId);
    },
    [acceptInvitationMutation]
  );

  const handleDeclineInvitation = useCallback(
    (notificationId: string) => {
      declineInvitationMutation.mutate(notificationId);
    },
    [declineInvitationMutation]
  );

  return {
    // Data
    notifications,
    groupedNotifications,
    hasNotifications,
    unreadCount,

    // Loading states
    isLoading,
    isRefetching,
    isError,
    error,

    // Actions
    refetch,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
    handleClearAll,
    handleAcceptInvitation,
    handleDeclineInvitation,

    // Mutation states (for UI feedback)
    isAccepting: acceptInvitationMutation.isPending,
    isDeclining: declineInvitationMutation.isPending,
    isClearing: deleteAllMutation.isPending,
  };
}