import { api } from "@services/api";
import type { MutualUser, ShareDishListData, ShareRecipeData, ShareResponse } from "../types";

export const shareService = {
  /**
   * Fetch current user's mutuals (users you follow who follow you back)
   */
  async getMutuals(search?: string): Promise<MutualUser[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await api.get<{ mutuals: MutualUser[] }>(
      `/users/mutuals${params}`
    );
    return response.data.mutuals;
  },

  /**
   * Share a DishList with multiple users
   */
  async shareDishList(data: ShareDishListData): Promise<ShareResponse> {
    const response = await api.post<ShareResponse>(
      `/dishlists/${data.dishListId}/share`,
      { recipientIds: data.recipientIds }
    );
    return response.data;
  },

  /**
   * Share a Recipe with multiple users
   */
  async shareRecipe(data: ShareRecipeData): Promise<ShareResponse> {
    const response = await api.post<ShareResponse>(
      `/recipes/${data.recipeId}/share`,
      { recipientIds: data.recipientIds }
    );
    return response.data;
  },

  /**
   * Generate a shareable deep link for a DishList
   */
  generateDishListLink(dishListId: string): string {
    return `dishlist://dishlist/${dishListId}`;
  },

  /**
   * Generate a shareable deep link for a Recipe
   */
  generateRecipeLink(recipeId: string): string {
    return `dishlist://recipe/${recipeId}`;
  },
};
