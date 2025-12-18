import { notificationService } from '../services/notificationService';
import { api } from '@services/api';

jest.mock('@services/api', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        type: 'RECIPE_SHARED',
        title: 'New Recipe',
        message: 'Pasta Carbonara',
        isRead: false,
        data: JSON.stringify({ recipeId: 'r-1', recipeTitle: 'Pasta Carbonara' }),
        createdAt: '2024-01-15T10:00:00Z',
        senderId: 'user-2',
        receiverId: 'user-1',
        sender: {
          uid: 'user-2',
          username: 'chef_bob',
          firstName: 'Bob',
          lastName: 'Smith',
          avatarUrl: null,
        },
      },
      {
        id: 'notif-2',
        type: 'DISHLIST_INVITATION',
        title: 'Invitation',
        message: 'Summer Recipes',
        isRead: true,
        data: JSON.stringify({ dishListId: 'dl-1', dishListTitle: 'Summer Recipes' }),
        createdAt: '2024-01-14T10:00:00Z',
        senderId: 'user-3',
        receiverId: 'user-1',
        sender: {
          uid: 'user-3',
          username: 'jane_cook',
          firstName: 'Jane',
          lastName: 'Doe',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      },
    ];

    it('fetches all notifications successfully', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { notifications: mockNotifications },
      });

      const result = await notificationService.getNotifications();

      expect(api.get).toHaveBeenCalledWith('/notifications');
      expect(result).toEqual(mockNotifications);
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no notifications', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { notifications: [] },
      });

      const result = await notificationService.getNotifications();

      expect(result).toEqual([]);
    });

    it('throws error when API call fails', async () => {
      const error = new Error('Network error');
      (api.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(notificationService.getNotifications()).rejects.toThrow('Network error');
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread count successfully', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { count: 5 },
      });

      const result = await notificationService.getUnreadCount();

      expect(api.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toBe(5);
    });

    it('returns 0 when no unread notifications', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { count: 0 },
      });

      const result = await notificationService.getUnreadCount();

      expect(result).toBe(0);
    });

    it('throws error when API call fails', async () => {
      (api.get as jest.Mock).mockRejectedValueOnce(new Error('Server error'));

      await expect(notificationService.getUnreadCount()).rejects.toThrow('Server error');
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read successfully', async () => {
      (api.patch as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      await notificationService.markAsRead('notif-1');

      expect(api.patch).toHaveBeenCalledWith('/notifications/notif-1/read');
    });

    it('throws error when notification not found', async () => {
      (api.patch as jest.Mock).mockRejectedValueOnce({
        response: { status: 404, data: { error: 'Notification not found' } },
      });

      await expect(notificationService.markAsRead('invalid-id')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read and returns updated count', async () => {
      (api.patch as jest.Mock).mockResolvedValueOnce({
        data: { success: true, updated: 3 },
      });

      const result = await notificationService.markAllAsRead();

      expect(api.patch).toHaveBeenCalledWith('/notifications/read-all');
      expect(result).toBe(3);
    });

    it('returns 0 when no notifications to update', async () => {
      (api.patch as jest.Mock).mockResolvedValueOnce({
        data: { success: true, updated: 0 },
      });

      const result = await notificationService.markAllAsRead();

      expect(result).toBe(0);
    });

    it('returns 0 when updated is undefined', async () => {
      (api.patch as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await notificationService.markAllAsRead();

      expect(result).toBe(0);
    });
  });

  describe('deleteNotification', () => {
    it('deletes a notification successfully', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      await notificationService.deleteNotification('notif-1');

      expect(api.delete).toHaveBeenCalledWith('/notifications/notif-1');
    });

    it('throws error when notification not found', async () => {
      (api.delete as jest.Mock).mockRejectedValueOnce({
        response: { status: 404, data: { error: 'Notification not found' } },
      });

      await expect(notificationService.deleteNotification('invalid-id')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe('deleteAllNotifications', () => {
    it('deletes all notifications and returns deleted count', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({
        data: { success: true, deleted: 5 },
      });

      const result = await notificationService.deleteAllNotifications();

      expect(api.delete).toHaveBeenCalledWith('/notifications');
      expect(result).toBe(5);
    });

    it('returns 0 when no notifications to delete', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({
        data: { success: true, deleted: 0 },
      });

      const result = await notificationService.deleteAllNotifications();

      expect(result).toBe(0);
    });

    it('returns 0 when deleted is undefined', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await notificationService.deleteAllNotifications();

      expect(result).toBe(0);
    });
  });

  describe('acceptInvitation', () => {
    it('accepts invitation and returns dishListId', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, dishListId: 'dl-123' },
      });

      const result = await notificationService.acceptInvitation('notif-1');

      expect(api.post).toHaveBeenCalledWith('/notifications/notif-1/accept-invitation');
      expect(result).toEqual({ dishListId: 'dl-123' });
    });

    it('throws error when invitation not found', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce({
        response: { status: 404, data: { error: 'Invitation not found' } },
      });

      await expect(notificationService.acceptInvitation('invalid-id')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    it('throws error when dishlist no longer exists', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce({
        response: { status: 404, data: { error: 'DishList no longer exists' } },
      });

      await expect(notificationService.acceptInvitation('notif-1')).rejects.toMatchObject({
        response: { data: { error: 'DishList no longer exists' } },
      });
    });
  });

  describe('declineInvitation', () => {
    it('declines invitation successfully', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      await notificationService.declineInvitation('notif-1');

      expect(api.post).toHaveBeenCalledWith('/notifications/notif-1/decline-invitation');
    });

    it('throws error when invitation not found', async () => {
      (api.post as jest.Mock).mockRejectedValueOnce({
        response: { status: 404, data: { error: 'Invitation not found' } },
      });

      await expect(notificationService.declineInvitation('invalid-id')).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });
});