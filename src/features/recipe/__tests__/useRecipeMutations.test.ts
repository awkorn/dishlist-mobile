import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@lib/queryKeys";
import {
  useAddRecipeToDishList,
  useUpdateRecipe,
} from "../hooks/useRecipeMutations";
import { recipeService } from "../services";
import type { DishListDetail, DishListRecipe } from "@features/dishlist/types";
import type { DishListDetailCache } from "@features/dishlist/hooks";
import type { Recipe, UpdateRecipeData } from "../types";

jest.mock("../services", () => ({
  recipeService: {
    addRecipeToDishList: jest.fn(),
    updateRecipe: jest.fn(),
  },
}));

const mockRecipeService = recipeService as jest.Mocked<typeof recipeService>;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false, gcTime: Infinity },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
}

describe("useAddRecipeToDishList", () => {
  it("adds the returned fork rather than the source recipe to the destination cache", async () => {
    const queryClient = createQueryClient();
    const destination: DishListDetail = {
      id: "dishlist-1",
      title: "Favorites",
      visibility: "PRIVATE",
      isDefault: false,
      isPinned: false,
      recipeCount: 0,
      followerCount: 0,
      collaboratorCount: 0,
      isOwner: true,
      isCollaborator: false,
      isFollowing: false,
      owner: { uid: "user-1" },
      recipes: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    const destinationCache: DishListDetailCache = {
      pages: [destination],
      pageParams: [0],
    };
    queryClient.setQueryData(
      queryKeys.dishLists.detail(destination.id),
      destinationCache,
    );

    mockRecipeService.addRecipeToDishList.mockResolvedValueOnce({
      message: "Recipe saved successfully",
      mode: "FORKED",
      recipe: {
        id: "fork-1",
        title: "Saved Pasta",
        creatorId: "user-1",
        creator: { uid: "user-1" },
        originalRecipeId: "source-1",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    });

    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useAddRecipeToDishList(), { wrapper });

    act(() => {
      result.current.mutate({
        dishListId: destination.id,
        recipeId: "source-1",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<DishListDetailCache>(
      queryKeys.dishLists.detail(destination.id),
    );
    expect(
      cached?.pages[0].recipes.map((recipe) => recipe.id),
    ).toEqual(["fork-1"]);
    expect(cached?.pages[0].recipeCount).toBe(1);
  });
});

describe("useUpdateRecipe", () => {
  const originalRecipe: Recipe = {
    id: "recipe-1",
    title: "Old Pasta",
    creatorId: "user-1",
    creator: { uid: "user-1" },
    ingredients: [{ type: "item", text: "Pasta" }],
    instructions: [{ type: "item", text: "Boil it" }],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };
  const originalSummary: DishListRecipe = {
    id: originalRecipe.id,
    title: originalRecipe.title,
    creatorId: originalRecipe.creatorId,
    creator: originalRecipe.creator,
    createdAt: originalRecipe.createdAt,
    updatedAt: originalRecipe.updatedAt,
  };
  const updateData: UpdateRecipeData = {
    title: "Weeknight Pasta",
    ingredients: originalRecipe.ingredients!,
    instructions: originalRecipe.instructions!,
    prepTime: 10,
    tags: ["quick"],
  };

  function seedDishListDetail(
    queryClient: QueryClient,
    dishListId: string,
  ) {
    const detail: DishListDetail = {
      id: dishListId,
      title: "Favorites",
      visibility: "PRIVATE",
      isDefault: false,
      isPinned: false,
      recipeCount: 1,
      followerCount: 0,
      collaboratorCount: 0,
      isOwner: true,
      isCollaborator: false,
      isFollowing: false,
      owner: { uid: "user-1" },
      recipes: [originalSummary],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    queryClient.setQueryData<DishListDetailCache>(
      queryKeys.dishLists.detail(dishListId),
      { pages: [detail], pageParams: [0] },
    );
  }

  it("optimistically updates the recipe title in every cached DishList", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["recipe", originalRecipe.id], originalRecipe);
    seedDishListDetail(queryClient, "dishlist-1");
    seedDishListDetail(queryClient, "dishlist-2");

    let resolveUpdate!: (recipe: Recipe) => void;
    mockRecipeService.updateRecipe.mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );

    const { result } = renderHook(() => useUpdateRecipe(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ recipeId: originalRecipe.id, data: updateData });
    });

    await waitFor(() => {
      const firstCache = queryClient.getQueryData<DishListDetailCache>(
        queryKeys.dishLists.detail("dishlist-1"),
      );
      const secondCache = queryClient.getQueryData<DishListDetailCache>(
        queryKeys.dishLists.detail("dishlist-2"),
      );
      expect(firstCache?.pages[0].recipes[0].title).toBe("Weeknight Pasta");
      expect(secondCache?.pages[0].recipes[0].title).toBe("Weeknight Pasta");
    });

    await act(async () => {
      resolveUpdate({
        ...originalRecipe,
        title: updateData.title,
        ingredients: updateData.ingredients,
        instructions: updateData.instructions,
        prepTime: updateData.prepTime,
        tags: updateData.tags,
        updatedAt: "2026-07-09",
      });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back DishList recipe summaries when an update fails", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(["recipe", originalRecipe.id], originalRecipe);
    seedDishListDetail(queryClient, "dishlist-1");
    mockRecipeService.updateRecipe.mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(() => useUpdateRecipe(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ recipeId: originalRecipe.id, data: updateData });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    const cached = queryClient.getQueryData<DishListDetailCache>(
      queryKeys.dishLists.detail("dishlist-1"),
    );
    expect(cached?.pages[0].recipes[0].title).toBe("Old Pasta");
    expect(
      queryClient.getQueryData<Recipe>(["recipe", originalRecipe.id])?.title,
    ).toBe("Old Pasta");
  });
});
