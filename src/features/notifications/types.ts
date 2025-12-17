export type NotificationType =
  | "DISHLIST_INVITATION"
  | "DISHLIST_SHARED"
  | "RECIPE_SHARED"
  | "RECIPE_ADDED"
  | "DISHLIST_FOLLOWED"
  | "COLLABORATION_ACCEPTED"
  | "COLLABORATION_DECLINED"
  | "USER_FOLLOWED"
  | "SYSTEM_UPDATE";

export interface NotificationSender {
  uid: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  data: string | null; // JSON string with type-specific data
  createdAt: string;
  senderId: string | null;
  receiverId: string;
  sender: NotificationSender | null;
}

// Parsed data types for each notification type
export interface DishListInvitationData {
  dishListId: string;
  dishListTitle: string;
  senderId: string;
  senderName: string;
}

export interface DishListSharedData {
  dishListId: string;
  dishListTitle: string;
  senderId: string;
  senderName: string;
}

export interface RecipeSharedData {
  recipeId: string;
  recipeTitle: string;
  senderId: string;
  senderName: string;
}

export interface RecipeAddedData {
  recipeId: string;
  recipeTitle: string;
  dishListId: string;
  dishListTitle: string;
  addedById: string;
  addedByName: string;
}

export interface DishListFollowedData {
  dishListId: string;
  dishListTitle: string;
  followerId: string;
  followerName: string;
}

export interface CollaborationAcceptedData {
  dishListId: string;
  dishListTitle: string;
  userId: string;
  userName: string;
}

export interface UserFollowedData {
  followerId: string;
  followerName: string;
}

export interface SystemUpdateData {
  updateType?: string;
  link?: string;
}

// Union type for all notification data
export type NotificationData =
  | DishListInvitationData
  | DishListSharedData
  | RecipeSharedData
  | RecipeAddedData
  | DishListFollowedData
  | CollaborationAcceptedData
  | UserFollowedData
  | SystemUpdateData;

// API Response types
export interface NotificationsResponse {
  notifications: Notification[];
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationActionResponse {
  success: boolean;
  updated?: number;
  deleted?: number;
  dishListId?: string;
  message?: string;
}

// Time-based section type for grouping
export type NotificationSection =
  | "new"
  | "today"
  | "yesterday"
  | "earlier_this_week"
  | "earlier";

export interface GroupedNotifications {
  new: Notification[];
  today: Notification[];
  yesterday: Notification[];
  earlier_this_week: Notification[];
  earlier: Notification[];
}

// Helper to check if notification is actionable (has Accept/Decline buttons)
export const isActionableNotification = (type: NotificationType): boolean => {
  return type === "DISHLIST_INVITATION";
};

// Helper to check if notification is navigable (can tap to go somewhere)
export const isNavigableNotification = (type: NotificationType): boolean => {
  return [
    "DISHLIST_SHARED",
    "RECIPE_SHARED",
    "RECIPE_ADDED",
  ].includes(type);
};

// Helper to parse notification data safely
export function parseNotificationData<T extends NotificationData>(
  dataString: string | null
): T | null {
  if (!dataString) return null;
  try {
    return JSON.parse(dataString) as T;
  } catch {
    return null;
  }
}