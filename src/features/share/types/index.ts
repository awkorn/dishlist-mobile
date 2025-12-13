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

export interface ShareResponse {
  success: boolean;
  notificationsSent: number;
}

export interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  shareType: 'dishlist' | 'recipe';
  contentId: string;
  contentTitle: string;
}