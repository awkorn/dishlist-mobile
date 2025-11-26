import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useRecipeDetail } from "../hooks/useRecipeDetail";
import { recipeService } from "../services/recipeService";

jest.mock("../services/recipeService", () => ({
  recipeService: {
    getRecipe: jest.fn(),
  },
}));

const mockRecipeService = recipeService as jest.Mocked<typeof recipeService>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useRecipeDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch recipe detail", async () => {
    const mockRecipe = {
      id: "recipe-1",
      title: "Test Recipe",
      ingredients: ["ingredient 1"],
      instructions: ["step 1"],
      creatorId: "user-1",
      creator: { uid: "user-1", username: "testuser" },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    };

    mockRecipeService.getRecipe.mockResolvedValueOnce(mockRecipe);

    const { result } = renderHook(
      () => useRecipeDetail({ recipeId: "recipe-1" }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockRecipeService.getRecipe).toHaveBeenCalledWith("recipe-1");
    expect(result.current.recipe).toEqual(mockRecipe);
    expect(result.current.isError).toBe(false);
  });

  it("should handle fetch error", async () => {
    mockRecipeService.getRecipe.mockRejectedValueOnce(
      new Error("Network error")
    );

    const { result } = renderHook(
      () => useRecipeDetail({ recipeId: "recipe-1" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.recipe).toBeUndefined();
  });

  it("should not fetch when disabled", async () => {
    const { result } = renderHook(
      () => useRecipeDetail({ recipeId: "recipe-1", enabled: false }),
      { wrapper: createWrapper() }
    );

    // Wait a tick to ensure query doesn't fire
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockRecipeService.getRecipe).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("should update nutrition cache", async () => {
    const mockRecipe = {
      id: "recipe-1",
      title: "Test Recipe",
      ingredients: ["ingredient 1"],
      instructions: ["step 1"],
      creatorId: "user-1",
      creator: { uid: "user-1" },
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      nutrition: null,
    };

    mockRecipeService.getRecipe.mockResolvedValueOnce(mockRecipe);

    const { result } = renderHook(
      () => useRecipeDetail({ recipeId: "recipe-1" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.recipe).toBeDefined();
    });

    const newNutrition = { calories: 500, protein: 20, carbs: 50, fat: 15 };
    result.current.updateNutritionCache(newNutrition);

    await waitFor(() => {
      expect(result.current.recipe?.nutrition).toEqual(newNutrition);
    });
  });
});
