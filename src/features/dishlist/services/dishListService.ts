import { api } from '@services/api';
import type { 
  DishList, 
  DishListDetail, 
  CreateDishListData, 
  UpdateDishListData,
  DishListTab 
} from '../types';

export const dishlistService = {
  /**
   * Fetch all dishlists for a given tab filter
   */
  async getDishLists(tab: DishListTab = 'all'): Promise<DishList[]> {
    const response = await api.get<{ dishLists: DishList[] }>(`/dishlists?tab=${tab}`);
    return response.data.dishLists;
  },

  /**
   * Fetch a single dishlist with full details including recipes
   */
  async getDishListDetail(id: string): Promise<DishListDetail> {
    const response = await api.get<{ dishList: DishListDetail }>(`/dishlists/${id}`);
    return response.data.dishList;
  },

  /**
   * Create a new dishlist
   */
  async createDishList(data: CreateDishListData): Promise<DishList> {
    const response = await api.post<{ dishList: DishList }>('/dishlists', data);
    return response.data.dishList;
  },

  /**
   * Update an existing dishlist
   */
  async updateDishList(id: string, data: UpdateDishListData): Promise<DishList> {
    const response = await api.put<{ dishList: DishList }>(`/dishlists/${id}`, data);
    return response.data.dishList;
  },

  /**
   * Delete a dishlist
   */
  async deleteDishList(id: string): Promise<void> {
    await api.delete(`/dishlists/${id}`);
  },

  /**
   * Pin a dishlist
   */
  async pinDishList(id: string): Promise<void> {
    await api.post(`/dishlists/${id}/pin`);
  },

  /**
   * Unpin a dishlist
   */
  async unpinDishList(id: string): Promise<void> {
    await api.delete(`/dishlists/${id}/pin`);
  },

  /**
   * Follow a dishlist
   */
  async followDishList(id: string): Promise<void> {
    await api.post(`/dishlists/${id}/follow`);
  },

  /**
   * Unfollow a dishlist
   */
  async unfollowDishList(id: string): Promise<void> {
    await api.delete(`/dishlists/${id}/follow`);
  },

  /**
   * Remove a recipe from a dishlist
   */
  async removeRecipeFromDishList(dishListId: string, recipeId: string): Promise<void> {
    await api.delete(`/dishlists/${dishListId}/recipes/${recipeId}`);
  },
};