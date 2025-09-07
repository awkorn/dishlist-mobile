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

export default api;
