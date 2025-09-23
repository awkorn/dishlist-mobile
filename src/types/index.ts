export interface User {
  uid: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface DishList {
  id: string;
  title: string;
  description?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  isDefault: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  instructions: string[];
  ingredients: string[]; 
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  nutrition?: { 
    calories?: number;
    protein?: number;
    carbs?: number;
    sugar?: number;
    fat?: number;
  };
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