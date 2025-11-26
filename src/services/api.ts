import axios from "axios";
import { auth } from '@services/firebase';

// TODO : Update the API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export interface DishList {
  id: string;
  title: string;
  description?: string;
  visibility: "PUBLIC" | "PRIVATE";
  isDefault: boolean;
  isPinned: boolean;
  recipeCount: number;
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

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  instructions?: string[];
  ingredients?: string[];
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

export interface DishListDetail extends DishList {
  description?: string;
  followerCount: number;
  recipes: Recipe[];
}

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
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export interface ProfileData {
  user: UserProfile;
  dishlists: DishList[];
  recipes: Recipe[];
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getDishLists = async (
  tab: string = "all"
): Promise<DishList[]> => {
  const response = await api.get(`/dishlists?tab=${tab}`);
  return response.data.dishLists;
};

export const createDishList = async (data: {
  title: string;
  description?: string;
  visibility?: "PUBLIC" | "PRIVATE";
}): Promise<DishList> => {
  const response = await api.post("/dishlists", data);
  return response.data.dishList;
};

export const updateDishList = async (
  id: string,
  data: {
    title: string;
    description?: string;
    visibility: "PUBLIC" | "PRIVATE";
  }
): Promise<DishList> => {
  const response = await api.put(`/dishlists/${id}`, data);
  return response.data.dishList;
};

export const getDishListDetail = async (
  id: string
): Promise<DishListDetail> => {
  const response = await api.get(`/dishlists/${id}`);
  return response.data.dishList;
};

export const followDishList = async (id: string): Promise<void> => {
  await api.post(`/dishlists/${id}/follow`);
};

export const unfollowDishList = async (id: string): Promise<void> => {
  await api.delete(`/dishlists/${id}/follow`);
};

export const pinDishList = async (id: string): Promise<void> => {
  await api.post(`/dishlists/${id}/pin`);
};

export const unpinDishList = async (id: string): Promise<void> => {
  await api.delete(`/dishlists/${id}/pin`);
};

export const deleteDishList = async (id: string): Promise<void> => {
  await api.delete(`/dishlists/${id}`);
};

export const createRecipe = async (data: {
  title: string;
  description?: string;
  instructions: string[];
  ingredients: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string | null;
  nutrition?: any;
  dishListId: string;
}): Promise<Recipe> => {
  const response = await api.post("/recipes", data);
  return response.data.recipe;
};

export const updateRecipe = async (
  id: string,
  data: {
    title: string;
    description?: string;
    instructions: string[];
    ingredients: string[];
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    imageUrl?: string | null;
    nutrition?: any;
  }
): Promise<Recipe> => {
  const response = await api.put(`/recipes/${id}`, data);
  return response.data.recipe;
};

export const getRecipe = async (id: string): Promise<Recipe> => {
  const response = await api.get(`/recipes/${id}`);
  return response.data.recipe;
};

export const addRecipeToDishList = async (
  dishListId: string,
  recipeId: string
): Promise<void> => {
  await api.post(`/dishlists/${dishListId}/recipes`, { recipeId });
};

export const getRecipeDishLists = async (
  recipeId: string
): Promise<string[]> => {
  const response = await api.get(`/recipes/${recipeId}/dishlists`);
  return response.data.dishListIds;
};

export const removeRecipeFromDishList = async (
  dishListId: string,
  recipeId: string
): Promise<void> => {
  await api.delete(`/dishlists/${dishListId}/recipes/${recipeId}`);
};

export const getUserProfile = async (userId: string): Promise<ProfileData> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const updateUserProfile = async (data: {
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}): Promise<UserProfile> => {
  const response = await api.put("/users/me", data);
  return response.data.user;
};

export default api;
