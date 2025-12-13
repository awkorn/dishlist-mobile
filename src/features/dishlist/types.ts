export interface DishListOwner {
  uid: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface DishList {
  id: string;
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  isDefault: boolean;
  isPinned: boolean;
  recipeCount: number;
  isOwner: boolean;
  isCollaborator: boolean;
  isFollowing: boolean;
  owner: DishListOwner;
  createdAt: string;
  updatedAt: string;
}

export interface DishListRecipe {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  tags?: string[];
  ingredients?: string[];
  creatorId: string;
  creator: DishListOwner;
  createdAt: string;
  updatedAt: string;
}

export interface DishListDetail extends DishList {
  followerCount: number;
  recipes: DishListRecipe[];
}

export interface CreateDishListData {
  title: string;
  description?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}

export interface UpdateDishListData {
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

export type DishListTab = 'all' | 'my' | 'collaborations' | 'following';

export type DishListTabLabel = 'All' | 'My DishLists' | 'Collaborations' | 'Following';

export const TAB_LABELS: DishListTabLabel[] = ['All', 'My DishLists', 'Collaborations', 'Following'];

export const TAB_TO_API_PARAM: Record<DishListTabLabel, DishListTab> = {
  'All': 'all',
  'My DishLists': 'my',
  'Collaborations': 'collaborations',
  'Following': 'following',
};