import { api } from "@services/api";
import type { GenerateRecipesRequest, GenerateRecipesResponse } from "../types";

export const builderService = {
  /**
   * Generate recipes from a user prompt using AI
   * Supports multi-turn conversation via history param
   */
  async generateRecipes(
    data: GenerateRecipesRequest
  ): Promise<GenerateRecipesResponse> {
    const response = await api.post<GenerateRecipesResponse>(
      "/builder/generate",
      data
    );
    return response.data;
  },
};
