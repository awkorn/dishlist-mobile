export interface MutualUser {
  uid: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

export interface ShareDishListData {
  dishListId: string;
  recipientIds: string[];
}

export interface ShareRecipeData {
  recipeId: string;
  recipientIds: string[];
}

export type ShareType = 'dishlist' | 'recipe' | 'profile';

export interface ShareResponse {
  success: boolean;
  notificationsSent: number;
}

export interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  shareType: ShareType;
  contentId: string;
  contentTitle: string;
}
