import { useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import { Alert } from "react-native";
import { queryKeys } from "@lib/queryKeys";
import { notificationService } from "../services/notificationService";
import type {
  Notification,
  NotificationsPage,
  GroupedNotifications,
} from "../types";

type NotificationsCache = InfiniteData<NotificationsPage, string | undefined>;

interface NotificationMutationContext {
  previousNotifications: NotificationsCache | undefined;
  previousUnreadCount: number | undefined;
}

/**
 * Apply a transform to the notification arrays of every cached page,
 * preserving page structure and cursors.
 */
function mapCachedPages(
  cache: NotificationsCache | undefined,
  transform: (notifications: Notification[]) => Notification[]
): NotificationsCache | undefined {
  if (!cache) return cache;
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      notifications: transform(page.notifications),
    })),
  };
}

function findCachedNotification(
  cache: NotificationsCache | undefined,
  notificationId: string
): Notification | undefined {
  return cache?.pages
    .flatMap((page) => page.notifications)
    .find((notification) => notification.id === notificationId);
}

/**
 * Stop active notification requests before an optimistic update so a stale
 * response cannot overwrite the row or badge while the mutation is pending.
 */
async function cancelNotificationQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.cancelQueries({
      queryKey: queryKeys.notifications.all,
      exact: true,
    }),
    queryClient.cancelQueries({
      queryKey: queryKeys.notifications.unread(),
      exact: true,
    }),
  ]);
}

function getMutationContext(
  queryClient: QueryClient
): NotificationMutationContext {
  return {
    previousNotifications: queryClient.getQueryData<NotificationsCache>(
      queryKeys.notifications.all
    ),
    previousUnreadCount: queryClient.getQueryData<number>(
      queryKeys.notifications.unread()
    ),
  };
}

function restoreNotificationContext(
  queryClient: QueryClient,
  context: NotificationMutationContext | undefined
) {
  if (!context) return;

  if (context.previousNotifications !== undefined) {
    queryClient.setQueryData(
      queryKeys.notifications.all,
      context.previousNotifications
    );
  }

  if (context.previousUnreadCount !== undefined) {
    queryClient.setQueryData(
      queryKeys.notifications.unread(),
      context.previousUnreadCount
    );
  }
}

function decrementUnreadCount(
  queryClient: QueryClient,
  notification: Notification | undefined
) {
  if (notification?.isRead !== false) return;

  queryClient.setQueryData<number>(
    queryKeys.notifications.unread(),
    (old) => (old === undefined ? old : Math.max(0, old - 1))
  );
}

function removeNotificationFromCache(
  queryClient: QueryClient,
  notificationId: string
) {
  queryClient.setQueryData<NotificationsCache>(
    queryKeys.notifications.all,
    (old) =>
      mapCachedPages(old, (items) =>
        items.filter((notification) => notification.id !== notificationId)
      )
  );
}

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

  // Fetch notifications, one cursor page at a time
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: ({ pageParam }) => notificationService.getNotifications(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30 * 1000, // Consider fresh for 30 seconds
  });

  // Flatten loaded pages for grouping/rendering
  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.notifications) ?? [],
    [data]
  );

  // Group notifications by time
  const groupedNotifications = useMemo(
    () => groupNotificationsByTime(notifications),
    [notifications]
  );

  // Check if there are any notifications
  const hasNotifications = notifications.length > 0;

  // Unread within the loaded pages (for local use only — the tab badge uses
  // the /unread-count query, which counts ALL unread server-side, so it stays
  // correct even when more unread exist beyond the loaded pages)
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // Mark single as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onMutate: async (notificationId) => {
      await cancelNotificationQueries(queryClient);
      const context = getMutationContext(queryClient);
      const notification = findCachedNotification(
        context.previousNotifications,
        notificationId
      );

      // Optimistically update
      queryClient.setQueryData<NotificationsCache>(
        queryKeys.notifications.all,
        (old) =>
          mapCachedPages(old, (items) =>
            items.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          )
      );

      decrementUnreadCount(queryClient, notification);

      return context;
    },
    onError: (_err, _id, context) => {
      restoreNotificationContext(queryClient, context);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onMutate: async () => {
      await cancelNotificationQueries(queryClient);
      const context = getMutationContext(queryClient);

      // Optimistically mark all as read
      queryClient.setQueryData<NotificationsCache>(
        queryKeys.notifications.all,
        (old) =>
          mapCachedPages(old, (items) =>
            items.map((n) => ({ ...n, isRead: true }))
          )
      );

      queryClient.setQueryData<number>(
        queryKeys.notifications.unread(),
        (old) => (old === undefined ? old : 0)
      );

      return context;
    },
    onError: (_err, _vars, context) => {
      restoreNotificationContext(queryClient, context);
    },
  });

  // Delete single notification mutation
  const deleteMutation = useMutation({
    mutationFn: notificationService.deleteNotification,
    onMutate: async (notificationId) => {
      await cancelNotificationQueries(queryClient);
      const context = getMutationContext(queryClient);
      const notification = findCachedNotification(
        context.previousNotifications,
        notificationId
      );

      removeNotificationFromCache(queryClient, notificationId);
      decrementUnreadCount(queryClient, notification);

      return context;
    },
    onError: (_err, _id, context) => {
      restoreNotificationContext(queryClient, context);
    },
  });

  // Delete all (Clear All) mutation
  const deleteAllMutation = useMutation({
    mutationFn: notificationService.deleteAllNotifications,
    onMutate: async () => {
      await cancelNotificationQueries(queryClient);
      const context = getMutationContext(queryClient);

      // Optimistically clear all (collapse to a single empty page)
      queryClient.setQueryData<NotificationsCache>(
        queryKeys.notifications.all,
        {
          pages: [{ notifications: [], nextCursor: null }],
          pageParams: [undefined],
        }
      );

      queryClient.setQueryData<number>(
        queryKeys.notifications.unread(),
        (old) => (old === undefined ? old : 0)
      );

      return context;
    },
    onError: (_err, _vars, context) => {
      restoreNotificationContext(queryClient, context);
      Alert.alert("Error", "Failed to clear notifications. Please try again.");
    },
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: notificationService.acceptInvitation,
    onMutate: async (notificationId) => {
      await cancelNotificationQueries(queryClient);
      const context = getMutationContext(queryClient);
      const notification = findCachedNotification(
        context.previousNotifications,
        notificationId
      );

      removeNotificationFromCache(queryClient, notificationId);
      decrementUnreadCount(queryClient, notification);

      return context;
    },
    onSuccess: () => {
      // Invalidate dishlist queries to show new collaboration
      queryClient.invalidateQueries({
        queryKey: queryKeys.dishLists.all,
      });
    },
    onError: (error: any, _id, context) => {
      restoreNotificationContext(queryClient, context);
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to accept invitation."
      );
    },
  });

  // Decline invitation mutation
  const declineInvitationMutation = useMutation({
    mutationFn: notificationService.declineInvitation,
    onMutate: async (notificationId) => {
      await cancelNotificationQueries(queryClient);
      const context = getMutationContext(queryClient);
      const notification = findCachedNotification(
        context.previousNotifications,
        notificationId
      );

      removeNotificationFromCache(queryClient, notificationId);
      decrementUnreadCount(queryClient, notification);

      return context;
    },
    onError: (_err, _id, context) => {
      restoreNotificationContext(queryClient, context);
      Alert.alert("Error", "Failed to decline invitation.");
    },
  });

  // Accept follow request mutation
  const acceptFollowMutation = useMutation({
    mutationFn: notificationService.acceptFollowRequest,
    onMutate: async (notificationId) => {
      await cancelNotificationQueries(queryClient);
      const context = getMutationContext(queryClient);
      const notification = findCachedNotification(
        context.previousNotifications,
        notificationId
      );

      removeNotificationFromCache(queryClient, notificationId);
      decrementUnreadCount(queryClient, notification);

      return context;
    },
    onError: (_err, _id, context) => {
      restoreNotificationContext(queryClient, context);
      Alert.alert("Error", "Failed to accept follow request.");
    },
  });

  // Decline follow request mutation
  const declineFollowMutation = useMutation({
    mutationFn: notificationService.declineFollowRequest,
    onMutate: async (notificationId) => {
      await cancelNotificationQueries(queryClient);
      const context = getMutationContext(queryClient);
      const notification = findCachedNotification(
        context.previousNotifications,
        notificationId
      );

      removeNotificationFromCache(queryClient, notificationId);
      decrementUnreadCount(queryClient, notification);

      return context;
    },
    onError: (_err, _id, context) => {
      restoreNotificationContext(queryClient, context);
      Alert.alert("Error", "Failed to decline follow request.");
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

  const handleAcceptFollow = useCallback(
    (notificationId: string) => {
      return acceptFollowMutation.mutateAsync(notificationId);
    },
    [acceptFollowMutation]
  );

  const handleDeclineFollow = useCallback(
    (notificationId: string) => {
      declineFollowMutation.mutate(notificationId);
    },
    [declineFollowMutation]
  );

  // Load the next page (no-op when everything is loaded or a fetch is running)
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // The notification currently being accepted/declined, so only that row
  // shows a spinner instead of every actionable row.
  const pendingActionId =
    (acceptInvitationMutation.isPending && acceptInvitationMutation.variables) ||
    (declineInvitationMutation.isPending && declineInvitationMutation.variables) ||
    (acceptFollowMutation.isPending && acceptFollowMutation.variables) ||
    (declineFollowMutation.isPending && declineFollowMutation.variables) ||
    null;

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
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,

    // Actions
    refetch,
    handleLoadMore,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
    handleClearAll,
    handleAcceptInvitation,
    handleDeclineInvitation,
    handleAcceptFollow,
    handleDeclineFollow,

    // Mutation states (for UI feedback)
    pendingActionId,
    isAccepting: acceptInvitationMutation.isPending,
    isDeclining: declineInvitationMutation.isPending,
    isClearing: deleteAllMutation.isPending,
    isAcceptingFollow: acceptFollowMutation.isPending,
    isDecliningFollow: declineFollowMutation.isPending,
  };
}
