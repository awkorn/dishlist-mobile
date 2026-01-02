import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useDishListDetail } from "../hooks/useDishListDetail";
import { dishlistService } from "../services/dishListService";

jest.mock("../services/dishlistService");

const mockDishlistService = dishlistService as jest.Mocked<
  typeof dishlistService
>;

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

describe("useDishListDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDishListDetail = {
    id: "1",
    title: "My Recipes",
    description: "My favorite recipes",
    visibility: "PUBLIC" as const,
    isDefault: true,
    isPinned: false,
    recipeCount: 2,
    followerCount: 10,
    collaboratorCount: 0,
    isOwner: true,
    isCollaborator: false,
    isFollowing: false,
    owner: { uid: "user-1" },
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    recipes: [
      {
        id: "r1",
        title: "Pasta Carbonara",
        description: "Creamy Italian pasta",
        creatorId: "user-1",
        creator: { uid: "user-1" },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: "r2",
        title: "Chicken Curry",
        description: "Spicy Indian curry",
        creatorId: "user-1",
        creator: { uid: "user-1" },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ],
  };

  it("should fetch dishlist detail successfully", async () => {
    mockDishlistService.getDishListDetail.mockResolvedValueOnce(
      mockDishListDetail
    );

    const { result } = renderHook(
      () => useDishListDetail({ dishListId: "1" }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dishList).toEqual(mockDishListDetail);
    expect(result.current.filteredRecipes).toHaveLength(2);
    expect(result.current.isError).toBe(false);
  });

  it("should filter recipes by search query", async () => {
    mockDishlistService.getDishListDetail.mockResolvedValueOnce(
      mockDishListDetail
    );

    const { result } = renderHook(
      () => useDishListDetail({ dishListId: "1", searchQuery: "Pasta" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filteredRecipes).toHaveLength(1);
    expect(result.current.filteredRecipes[0].title).toBe("Pasta Carbonara");
  });

  it("should filter recipes by description", async () => {
    mockDishlistService.getDishListDetail.mockResolvedValueOnce(
      mockDishListDetail
    );

    const { result } = renderHook(
      () => useDishListDetail({ dishListId: "1", searchQuery: "Indian" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filteredRecipes).toHaveLength(1);
    expect(result.current.filteredRecipes[0].title).toBe("Chicken Curry");
  });

  it("should handle errors", async () => {
    mockDishlistService.getDishListDetail.mockRejectedValueOnce(
      new Error("Not found")
    );

    const { result } = renderHook(
      () => useDishListDetail({ dishListId: "1" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.dishList).toBeUndefined();
    expect(result.current.filteredRecipes).toEqual([]);
  });

  it("should return empty recipes when search has no matches", async () => {
    mockDishlistService.getDishListDetail.mockResolvedValueOnce(
      mockDishListDetail
    );

    const { result } = renderHook(
      () => useDishListDetail({ dishListId: "1", searchQuery: "Pizza" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.filteredRecipes).toHaveLength(0);
  });
});
