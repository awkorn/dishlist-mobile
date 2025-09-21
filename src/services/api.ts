import axios from "axios";
import { auth } from "../config/firebase";

// TODO : Update the API base URL
const API_BASE_URL = __DEV__
  ? "http://192.168.1.40:3000"
  : "https://api.example.com";

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
  instructions?: string;
  ingredients?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
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

export const getDishListDetail = async (id: string): Promise<DishListDetail> => {
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


export default api;
