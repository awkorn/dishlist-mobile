import { api } from '@services/api';
import type {
  DishList,
  DishListDetail,
  DishListsPage,
  CreateDishListData,
  UpdateDishListData,
  DishListTab
} from '../types';

export const DISH_LISTS_PAGE_SIZE = 30;
export const DISH_LIST_RECIPES_PAGE_SIZE = 30;

export const dishlistService = {
  /**
   * Fetch one page of dishlists for a given tab filter
   */
  async getDishLists(
    tab: DishListTab = 'all',
    options: { limit?: number; offset?: number } = {}
  ): Promise<DishListsPage> {
    const limit = options.limit ?? DISH_LISTS_PAGE_SIZE;
    const offset = options.offset ?? 0;
    const response = await api.get<DishListsPage>(
      `/dishlists?tab=${tab}&limit=${limit}&offset=${offset}`
    );
    const { dishLists, meta } = response.data;
    return {
      dishLists,
      // Fallback for a server that predates pagination metadata
      meta: meta ?? { limit, offset, total: dishLists.length, hasMore: false },
    };
  },

  /**
   * Fetch a single dishlist with full details and one page of recipes
   */
  async getDishListDetail(
    id: string,
    options: { recipesLimit?: number; recipesOffset?: number } = {}
  ): Promise<DishListDetail> {
    const recipesLimit = options.recipesLimit ?? DISH_LIST_RECIPES_PAGE_SIZE;
    const recipesOffset = options.recipesOffset ?? 0;
    const response = await api.get<{ dishList: DishListDetail }>(
      `/dishlists/${id}?recipesLimit=${recipesLimit}&recipesOffset=${recipesOffset}`
    );
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