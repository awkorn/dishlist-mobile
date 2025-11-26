import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useDishLists } from "../hooks/useDishLists";
import { dishlistService } from "../services/dishListService";

jest.mock("../services/dishlistService");

const mockDishlistService = dishlistService as jest.Mocked<
  typeof dishlistService
>;

describe("useDishLists", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({});
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
  };

  it("should fetch dishlists successfully", async () => {
    const mockDishLists = [
      {
        id: "1",
        title: "My Recipes",
        recipeCount: 5,
        isOwner: true,
        isCollaborator: false,
        isFollowing: false,
        visibility: "PUBLIC" as const,
        isDefault: true,
        isPinned: false,
        owner: { uid: "user-1" },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: "2",
        title: "Family Recipes",
        recipeCount: 3,
        isOwner: true,
        isCollaborator: false,
        isFollowing: false,
        visibility: "PUBLIC" as const,
        isDefault: false,
        isPinned: false,
        owner: { uid: "user-1" },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ];

    mockDishlistService.getDishLists.mockResolvedValueOnce(mockDishLists);

    const { result } = renderHook(() => useDishLists({ tab: "all" }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dishLists).toEqual(mockDishLists);
    expect(result.current.isError).toBe(false);
  });

  it("should filter dishlists by search query", async () => {
    const mockDishLists = [
      {
        id: "1",
        title: "My Recipes",
        recipeCount: 5,
        isOwner: true,
        isCollaborator: false,
        isFollowing: false,
        visibility: "PUBLIC" as const,
        isDefault: true,
        isPinned: false,
        owner: { uid: "user-1" },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
      {
        id: "2",
        title: "Family Recipes",
        recipeCount: 3,
        isOwner: true,
        isCollaborator: false,
        isFollowing: false,
        visibility: "PUBLIC" as const,
        isDefault: false,
        isPinned: false,
        owner: { uid: "user-1" },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ];

    mockDishlistService.getDishLists.mockResolvedValueOnce(mockDishLists);

    const { result } = renderHook(
      () => useDishLists({ tab: "all", searchQuery: "Family" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dishLists).toHaveLength(1);
    expect(result.current.dishLists[0].title).toBe("Family Recipes");
  });

  it("should handle errors", async () => {
    mockDishlistService.getDishLists.mockRejectedValueOnce(
      new Error("Network error")
    );

    const { result } = renderHook(() => useDishLists({ tab: "all" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.dishLists).toEqual([]);
  });

  it("should return empty array when search has no matches", async () => {
    const mockDishLists = [
      {
        id: "1",
        title: "My Recipes",
        recipeCount: 5,
        isOwner: true,
        isCollaborator: false,
        isFollowing: false,
        visibility: "PUBLIC" as const,
        isDefault: true,
        isPinned: false,
        owner: { uid: "user-1" },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ];

    mockDishlistService.getDishLists.mockResolvedValueOnce(mockDishLists);

    const { result } = renderHook(
      () => useDishLists({ tab: "all", searchQuery: "NonExistent" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dishLists).toHaveLength(0);
  });
});
