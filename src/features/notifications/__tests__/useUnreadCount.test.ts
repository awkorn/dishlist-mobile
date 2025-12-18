import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { notificationService } from '../services/notificationService';

jest.mock('../services/notificationService', () => ({
  notificationService: {
    getUnreadCount: jest.fn(),
  },
}));

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useUnreadCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial loading', () => {
    it('fetches unread count on mount', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(5);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.count).toBe(5);
      });

      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledTimes(1);
    });

    it('returns 0 as default before data loads', () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(3);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      // Before data loads, count should default to 0
      expect(result.current.count).toBe(0);
    });

    it('returns 0 when no unread notifications', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(0);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockNotificationService.getUnreadCount).toHaveBeenCalled();
      });

      expect(result.current.count).toBe(0);
    });
  });

  describe('hasUnread computed property', () => {
    it('returns true when count > 0', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(3);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.count).toBe(3);
      });

      expect(result.current.hasUnread).toBe(true);
    });

    it('returns false when count is 0', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(0);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockNotificationService.getUnreadCount).toHaveBeenCalled();
      });

      expect(result.current.hasUnread).toBe(false);
    });

    it('returns false before data loads (default count is 0)', () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(5);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      // Before data loads
      expect(result.current.hasUnread).toBe(false);
    });
  });

  describe('refetch', () => {
    it('provides refetch function', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(2);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.count).toBe(2);
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('updates count when refetch is called', async () => {
      mockNotificationService.getUnreadCount
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(5);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.count).toBe(2);
      });

      // Trigger refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.count).toBe(5);
      });

      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('defaults to 0 on error', async () => {
      mockNotificationService.getUnreadCount.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      // Wait for query to complete (even with error)
      await waitFor(() => {
        expect(mockNotificationService.getUnreadCount).toHaveBeenCalled();
      });

      // Should still default to 0
      expect(result.current.count).toBe(0);
      expect(result.current.hasUnread).toBe(false);
    });
  });

  describe('large counts', () => {
    it('handles large unread counts', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(999);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.count).toBe(999);
      });

      expect(result.current.hasUnread).toBe(true);
    });
  });
});