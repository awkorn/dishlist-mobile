import { api } from "@services/api";
import type {
  Notification,
  NotificationsResponse,
  UnreadCountResponse,
  NotificationActionResponse,
} from "../types";

export const notificationService = {
  /**
   * Fetch all notifications for the current user
   */
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<NotificationsResponse>("/notifications");
    return response.data.notifications;
  },

  /**
   * Get count of unread notifications (for badge)
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<UnreadCountResponse>(
      "/notifications/unread-count"
    );
    return response.data.count;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await api.patch<NotificationActionResponse>(
      `/notifications/${notificationId}/read`
    );
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    const response = await api.patch<NotificationActionResponse>(
      "/notifications/read-all"
    );
    return response.data.updated ?? 0;
  },

  /**
   * Delete a single notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete<NotificationActionResponse>(
      `/notifications/${notificationId}`
    );
  },

  /**
   * Delete all notifications (Clear All)
   */
  async deleteAllNotifications(): Promise<number> {
    const response = await api.delete<NotificationActionResponse>(
      "/notifications"
    );
    return response.data.deleted ?? 0;
  },

  /**
   * Accept a DishList collaboration invitation
   * Returns the dishListId on success for navigation
   */
  async acceptInvitation(
    notificationId: string
  ): Promise<{ dishListId: string }> {
    const response = await api.post<NotificationActionResponse>(
      `/notifications/${notificationId}/accept-invitation`
    );
    return { dishListId: response.data.dishListId! };
  },

  /**
   * Decline a DishList collaboration invitation
   */
  async declineInvitation(notificationId: string): Promise<void> {
    await api.post<NotificationActionResponse>(
      `/notifications/${notificationId}/decline-invitation`
    );
  },
};