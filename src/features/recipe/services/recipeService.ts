import { api } from "@services/api";
import type {
  Recipe,
  CreateRecipeData,
  UpdateRecipeData,
  ImportRecipeResponse,
  ImageData,
} from "../types";

export const recipeService = {
  /**
   * Fetch a single recipe by ID
   */
  async getRecipe(id: string): Promise<Recipe> {
    const response = await api.get<{ recipe: Recipe }>(`/recipes/${id}`);
    return response.data.recipe;
  },

  /**
   * Create a new recipe
   */
  async createRecipe(data: CreateRecipeData): Promise<Recipe> {
    const response = await api.post<{ recipe: Recipe }>("/recipes", data);
    return response.data.recipe;
  },

  /**
   * Update an existing recipe
   */
  async updateRecipe(id: string, data: UpdateRecipeData): Promise<Recipe> {
    const response = await api.put<{ recipe: Recipe }>(`/recipes/${id}`, data);
    return response.data.recipe;
  },

  /**
   * Add recipe to a DishList
   */
  async addRecipeToDishList(
    dishListId: string,
    recipeId: string
  ): Promise<void> {
    await api.post(`/dishlists/${dishListId}/recipes`, { recipeId });
  },

  /**
   * Get all DishList IDs that contain this recipe
   */
  async getRecipeDishLists(recipeId: string): Promise<string[]> {
    const response = await api.get<{ dishListIds: string[] }>(
      `/recipes/${recipeId}/dishlists`
    );
    return response.data.dishListIds;
  },

  /**
   * Import recipe from images using AI extraction
   * @param images Array of image data (base64 encoded)
   * @returns Extracted recipe data with any warnings
   */
  async importFromImages(images: ImageData[]): Promise<ImportRecipeResponse> {
    const payload = {
      images: images.map((img) => ({
        base64: img.base64,
        mimeType: img.mimeType,
      })),
    };

    const response = await api.post<ImportRecipeResponse>(
      "/recipes/import-from-images",
      payload
    );

    return response.data;
  },
};
