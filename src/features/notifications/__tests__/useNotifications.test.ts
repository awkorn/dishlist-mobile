import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import React from 'react';
import { useNotifications, getSectionTitle } from '../hooks/useNotifications';
import { notificationService } from '../services/notificationService';
import { queryKeys } from '@lib/queryKeys';
import type { Notification } from '../types';

jest.mock('../services/notificationService', () => ({
  notificationService: {
    getNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    deleteAllNotifications: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
    acceptFollowRequest: jest.fn(),
    declineFollowRequest: jest.fn(),
  },
}));

jest.spyOn(Alert, 'alert');

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper = (queryClient = createTestQueryClient()) => {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// Helper to create mock notifications
const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'notif-1',
  type: 'RECIPE_SHARED',
  title: 'New Recipe',
  message: 'Pasta Carbonara',
  isRead: false,
  data: JSON.stringify({ recipeId: 'r-1', recipeTitle: 'Pasta Carbonara' }),
  createdAt: new Date().toISOString(),
  senderId: 'user-2',
  receiverId: 'user-1',
  sender: {
    uid: 'user-2',
    username: 'chef_bob',
    firstName: 'Bob',
    lastName: 'Smith',
    avatarUrl: null,
  },
  ...overrides,
});

// The service returns cursor pages; most tests only need a single page.
const asPage = (
  notifications: Notification[],
  nextCursor: string | null = null
) => ({ notifications, nextCursor });

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial loading', () => {
    it('loads notifications on mount', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1' }),
        createMockNotification({ id: 'notif-2', isRead: true }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toEqual(mockNotifications);
      expect(result.current.hasNotifications).toBe(true);
      expect(mockNotificationService.getNotifications).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no notifications exist', async () => {
      mockNotificationService.getNotifications.mockResolvedValue(asPage([]));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toEqual([]);
      expect(result.current.hasNotifications).toBe(false);
    });

    it('handles fetch error', async () => {
      mockNotificationService.getNotifications.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.notifications).toEqual([]);
    });
  });

  describe('unread count', () => {
    it('calculates unread count correctly', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
        createMockNotification({ id: 'notif-2', isRead: false }),
        createMockNotification({ id: 'notif-3', isRead: true }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.unreadCount).toBe(2);
    });

    it('returns 0 when all notifications are read', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', isRead: true }),
        createMockNotification({ id: 'notif-2', isRead: true }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('groupedNotifications', () => {
    it('groups unread notifications in "new" section', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
        createMockNotification({ id: 'notif-2', isRead: true }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.groupedNotifications.new).toHaveLength(1);
      expect(result.current.groupedNotifications.new[0].id).toBe('notif-1');
    });

    it('groups read notifications by time', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 5);
      const lastMonth = new Date(now);
      lastMonth.setDate(lastMonth.getDate() - 20);

      const mockNotifications = [
        createMockNotification({ id: 'today', isRead: true, createdAt: now.toISOString() }),
        createMockNotification({ id: 'yesterday', isRead: true, createdAt: yesterday.toISOString() }),
        createMockNotification({ id: 'earlier-week', isRead: true, createdAt: lastWeek.toISOString() }),
        createMockNotification({ id: 'earlier', isRead: true, createdAt: lastMonth.toISOString() }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.groupedNotifications.new).toHaveLength(0);
      expect(result.current.groupedNotifications.today).toHaveLength(1);
      expect(result.current.groupedNotifications.yesterday).toHaveLength(1);
      // Note: earlier_this_week depends on current day of week
    });
  });

  describe('handleMarkAsRead', () => {
    it('marks a notification as read', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      mockNotificationService.markAsRead.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleMarkAsRead('notif-1');
      });

      await waitFor(() => {
        expect(mockNotificationService.markAsRead).toHaveBeenCalled();
      });
      
      expect(mockNotificationService.markAsRead.mock.calls[0][0]).toBe('notif-1');
    });

    it('optimistically updates notification to read', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      
      // Create a promise we can control to keep mutation pending
      let resolveMarkAsRead: () => void;
      const markAsReadPromise = new Promise<void>((resolve) => {
        resolveMarkAsRead = resolve;
      });
      mockNotificationService.markAsRead.mockReturnValue(markAsReadPromise);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger the mutation
      act(() => {
        result.current.handleMarkAsRead('notif-1');
      });

      // Check optimistic update happened immediately (before mutation resolves)
      await waitFor(() => {
        const notification = result.current.notifications.find((n) => n.id === 'notif-1');
        expect(notification?.isRead).toBe(true);
      });

      // Clean up - resolve the promise
      await act(async () => {
        resolveMarkAsRead!();
      });
    });
  });

  describe('handleMarkAllAsRead', () => {
    it('marks all notifications as read', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
        createMockNotification({ id: 'notif-2', isRead: false }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      mockNotificationService.markAllAsRead.mockResolvedValue(2);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleMarkAllAsRead();
      });

      await waitFor(() => {
        expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
      });
    });
  });

  describe('handleDelete', () => {
    it('deletes a notification', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1' }),
        createMockNotification({ id: 'notif-2' }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      mockNotificationService.deleteNotification.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleDelete('notif-1');
      });

      await waitFor(() => {
        expect(mockNotificationService.deleteNotification).toHaveBeenCalled();
      });
      
      // Check first argument is correct (ignore React Query's additional context)
      expect(mockNotificationService.deleteNotification.mock.calls[0][0]).toBe('notif-1');
    });

    it('optimistically removes notification from list', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1' }),
        createMockNotification({ id: 'notif-2' }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      
      // Keep mutation pending to observe optimistic update
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockNotificationService.deleteNotification.mockReturnValue(deletePromise);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toHaveLength(2);

      act(() => {
        result.current.handleDelete('notif-1');
      });

      // Check optimistic update - should immediately show 1 notification
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0].id).toBe('notif-2');
      });

      // Clean up
      await act(async () => {
        resolveDelete!();
      });
    });
  });

  describe('handleClearAll', () => {
    it('shows confirmation alert before clearing', async () => {
      const mockNotifications = [createMockNotification({ id: 'notif-1' })];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleClearAll();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Clear All Notifications',
        'Are you sure you want to delete all notifications?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Clear All', style: 'destructive' }),
        ])
      );
    });

    it('clears all notifications when confirmed', async () => {
      let alertCallback: (() => void) | undefined;
      (Alert.alert as jest.Mock).mockImplementation(
        (_title: string, _message: string, buttons: Array<{ text: string; onPress?: () => void }>) => {
          const clearButton = buttons?.find((b) => b.text === 'Clear All');
          alertCallback = clearButton?.onPress;
        }
      );

      const mockNotifications = [createMockNotification({ id: 'notif-1' })];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      mockNotificationService.deleteAllNotifications.mockResolvedValue(1);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleClearAll();
      });

      // Simulate user confirming
      if (alertCallback) {
        act(() => {
          alertCallback!();
        });
      }

      await waitFor(() => {
        expect(mockNotificationService.deleteAllNotifications).toHaveBeenCalled();
      });
    });
  });

  describe('handleAcceptInvitation', () => {
    it('accepts invitation and returns dishListId', async () => {
      const mockNotifications = [
        createMockNotification({
          id: 'notif-1',
          type: 'DISHLIST_INVITATION',
          data: JSON.stringify({ dishListId: 'dl-123', dishListTitle: 'Summer Recipes' }),
        }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      mockNotificationService.acceptInvitation.mockResolvedValue({ dishListId: 'dl-123' });

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let acceptResult: { dishListId: string } | undefined;
      await act(async () => {
        acceptResult = await result.current.handleAcceptInvitation('notif-1');
      });

      expect(mockNotificationService.acceptInvitation).toHaveBeenCalled();
      expect(mockNotificationService.acceptInvitation.mock.calls[0][0]).toBe('notif-1');
      expect(acceptResult).toEqual({ dishListId: 'dl-123' });
    });

    it('shows error alert on accept failure', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', type: 'DISHLIST_INVITATION' }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      mockNotificationService.acceptInvitation.mockRejectedValue({
        response: { data: { error: 'DishList no longer exists' } },
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.handleAcceptInvitation('notif-1');
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'DishList no longer exists');
      });
    });

    it('sets isAccepting state while accepting', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', type: 'DISHLIST_INVITATION' }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      
      // Create a promise that we can control
      let resolveAccept: (value: { dishListId: string }) => void;
      const acceptPromise = new Promise<{ dishListId: string }>((resolve) => {
        resolveAccept = resolve;
      });
      mockNotificationService.acceptInvitation.mockReturnValue(acceptPromise);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAccepting).toBe(false);

      act(() => {
        result.current.handleAcceptInvitation('notif-1');
      });

      await waitFor(() => {
        expect(result.current.isAccepting).toBe(true);
      });

      // Resolve the promise
      await act(async () => {
        resolveAccept!({ dishListId: 'dl-123' });
      });

      await waitFor(() => {
        expect(result.current.isAccepting).toBe(false);
      });
    });
  });

  describe('handleDeclineInvitation', () => {
    it('declines invitation successfully', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', type: 'DISHLIST_INVITATION' }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      mockNotificationService.declineInvitation.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleDeclineInvitation('notif-1');
      });

      await waitFor(() => {
        expect(mockNotificationService.declineInvitation).toHaveBeenCalled();
      });
      
      expect(mockNotificationService.declineInvitation.mock.calls[0][0]).toBe('notif-1');
    });

    it('optimistically removes notification after decline', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', type: 'DISHLIST_INVITATION' }),
        createMockNotification({ id: 'notif-2', type: 'RECIPE_SHARED' }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      
      // Keep mutation pending to observe optimistic update
      let resolveDecline: () => void;
      const declinePromise = new Promise<void>((resolve) => {
        resolveDecline = resolve;
      });
      mockNotificationService.declineInvitation.mockReturnValue(declinePromise);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toHaveLength(2);

      act(() => {
        result.current.handleDeclineInvitation('notif-1');
      });

      // Check optimistic update
      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      // Clean up
      await act(async () => {
        resolveDecline!();
      });
    });

    it('shows error alert on decline failure', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', type: 'DISHLIST_INVITATION' }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      mockNotificationService.declineInvitation.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleDeclineInvitation('notif-1');
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to decline invitation.');
      });
    });
  });

  describe('follow request actions', () => {
    it('optimistically removes an accepted request and updates the badge without refetching', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', type: 'FOLLOW_REQUEST', isRead: false }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));

      let resolveAccept: (value: { success: boolean }) => void;
      const acceptPromise = new Promise<{ success: boolean }>((resolve) => {
        resolveAccept = resolve;
      });
      mockNotificationService.acceptFollowRequest.mockReturnValue(acceptPromise);

      const queryClient = createTestQueryClient();
      queryClient.setQueryDefaults(queryKeys.notifications.unread(), {
        gcTime: Infinity,
      });
      queryClient.setQueryData(queryKeys.notifications.unread(), 1);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let mutationPromise!: Promise<{ success: boolean }>;
      act(() => {
        mutationPromise = result.current.handleAcceptFollow('notif-1');
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(0);
        expect(queryClient.getQueryData(queryKeys.notifications.unread())).toBe(0);
      });
      expect(result.current.isRefetching).toBe(false);

      await act(async () => {
        resolveAccept!({ success: true });
        await mutationPromise;
      });

      expect(mockNotificationService.getNotifications).toHaveBeenCalledTimes(1);
      expect(queryClient.getQueryData(queryKeys.notifications.unread())).toBe(0);
    });

    it('restores the request and badge when accepting fails', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', type: 'FOLLOW_REQUEST', isRead: false }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      mockNotificationService.acceptFollowRequest.mockRejectedValue(new Error('Failed'));

      const queryClient = createTestQueryClient();
      queryClient.setQueryDefaults(queryKeys.notifications.unread(), {
        gcTime: Infinity,
      });
      queryClient.setQueryData(queryKeys.notifications.unread(), 1);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.handleAcceptFollow('notif-1');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(queryClient.getQueryData(queryKeys.notifications.unread())).toBe(1);
      expect(mockNotificationService.getNotifications).toHaveBeenCalledTimes(1);
    });

    it('shows error alert when accepting a follow request fails', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', type: 'FOLLOW_REQUEST' }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      mockNotificationService.acceptFollowRequest.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        try {
          await result.current.handleAcceptFollow('notif-1');
        } catch (e) {
          // Expected to throw
        }
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to accept follow request.');
      });

      // Optimistic removal was rolled back
      expect(result.current.notifications).toHaveLength(1);
    });

    it('shows error alert when declining a follow request fails', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', type: 'FOLLOW_REQUEST' }),
      ];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));
      mockNotificationService.declineFollowRequest.mockRejectedValue(new Error('Failed'));

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.handleDeclineFollow('notif-1');
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to decline follow request.');
      });
    });
  });

  describe('pagination', () => {
    it('flattens pages and loads more via handleLoadMore', async () => {
      const pageOne = [createMockNotification({ id: 'notif-1' })];
      const pageTwo = [createMockNotification({ id: 'notif-2' })];
      mockNotificationService.getNotifications.mockImplementation((cursor?: string) =>
        Promise.resolve(
          cursor === 'cursor-1' ? asPage(pageTwo) : asPage(pageOne, 'cursor-1')
        )
      );

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.hasNextPage).toBe(true);

      act(() => {
        result.current.handleLoadMore();
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });

      expect(result.current.notifications.map((n) => n.id)).toEqual([
        'notif-1',
        'notif-2',
      ]);
      expect(result.current.hasNextPage).toBe(false);
      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('cursor-1');
    });

    it('does not fetch when there is no next page', async () => {
      mockNotificationService.getNotifications.mockResolvedValue(
        asPage([createMockNotification({ id: 'notif-1' })])
      );

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasNextPage).toBe(false);

      act(() => {
        result.current.handleLoadMore();
      });

      expect(mockNotificationService.getNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('mutation loading states', () => {
    it('tracks isClearing state', async () => {
      let alertCallback: (() => void) | undefined;
      (Alert.alert as jest.Mock).mockImplementation(
        (_title: string, _message: string, buttons: Array<{ text: string; onPress?: () => void }>) => {
          const clearButton = buttons?.find((b) => b.text === 'Clear All');
          alertCallback = clearButton?.onPress;
        }
      );

      const mockNotifications = [createMockNotification({ id: 'notif-1' })];
      mockNotificationService.getNotifications.mockResolvedValue(asPage(mockNotifications));

      let resolveDelete: (value: number) => void;
      const deletePromise = new Promise<number>((resolve) => {
        resolveDelete = resolve;
      });
      mockNotificationService.deleteAllNotifications.mockReturnValue(deletePromise);

      const { result } = renderHook(() => useNotifications(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isClearing).toBe(false);

      act(() => {
        result.current.handleClearAll();
      });

      if (alertCallback) {
        act(() => {
          alertCallback!();
        });
      }

      await waitFor(() => {
        expect(result.current.isClearing).toBe(true);
      });

      await act(async () => {
        resolveDelete!(1);
      });

      await waitFor(() => {
        expect(result.current.isClearing).toBe(false);
      });
    });
  });
});

describe('getSectionTitle', () => {
  it('returns correct title for "new" section', () => {
    expect(getSectionTitle('new', 5)).toBe('New (5)');
  });

  it('returns correct title for "today" section', () => {
    expect(getSectionTitle('today', 3)).toBe('Today (3)');
  });

  it('returns correct title for "yesterday" section', () => {
    expect(getSectionTitle('yesterday', 2)).toBe('Yesterday (2)');
  });

  it('returns correct title for "earlier_this_week" section', () => {
    expect(getSectionTitle('earlier_this_week', 4)).toBe('Earlier this week (4)');
  });

  it('returns correct title for "earlier" section', () => {
    expect(getSectionTitle('earlier', 10)).toBe('Earlier (10)');
  });

  it('handles singular count', () => {
    expect(getSectionTitle('new', 1)).toBe('New (1)');
  });

  it('handles zero count', () => {
    expect(getSectionTitle('today', 0)).toBe('Today (0)');
  });
});
