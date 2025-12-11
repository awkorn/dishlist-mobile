export interface UserProfile {
  uid: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isOwnProfile: boolean;
}

export interface ProfileDishList {
  id: string;
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  isDefault: boolean;
  isPinned: boolean;
  recipeCount: number;
  followerCount: number;
  isOwner: boolean;
  isCollaborator: boolean;
  isFollowing: boolean;
  owner: {
    uid: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProfileRecipe {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  creatorId: string;
  creator: {
    uid: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProfileData {
  user: UserProfile;
  dishlists: ProfileDishList[];
  recipes: ProfileRecipe[];
}

export interface UpdateProfileData {
  username?: string;
  firstName?: string;
  lastName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface EditProfileState {
  firstName: string;
  lastName: string;
  username: string;
  bio: string;
  avatarUri: string | null;
  avatarChanged: boolean;
  isUploading: boolean;
}

export type ProfileTab = 'DishLists' | 'Recipes';