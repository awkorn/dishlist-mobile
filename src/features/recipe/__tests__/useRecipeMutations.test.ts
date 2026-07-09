import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@lib/queryKeys";
import { useAddRecipeToDishList } from "../hooks/useRecipeMutations";
import { recipeService } from "../services";
import type { DishListDetail } from "@features/dishlist/types";
import type { DishListDetailCache } from "@features/dishlist/hooks";

jest.mock("../services", () => ({
  recipeService: {
    addRecipeToDishList: jest.fn(),
  },
}));

const mockRecipeService = recipeService as jest.Mocked<typeof recipeService>;

describe("useAddRecipeToDishList", () => {
  it("adds the returned fork rather than the source recipe to the destination cache", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
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

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children,
      );
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
