import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { sortDishLists, useDishLists } from "../hooks/useDishLists";
import { dishlistService } from "../services";
import type { DishList, DishListTab } from "../types";

jest.mock("../services", () => ({
  dishlistService: {
    getDishLists: jest.fn(),
    getDishListDetail: jest.fn(),
    createDishList: jest.fn(),
    updateDishList: jest.fn(),
    deleteDishList: jest.fn(),
    pinDishList: jest.fn(),
    unpinDishList: jest.fn(),
    followDishList: jest.fn(),
    unfollowDishList: jest.fn(),
    removeRecipeFromDishList: jest.fn(),
  },
}));

const mockDishlistService = dishlistService as jest.Mocked<
  typeof dishlistService
>;

const toPage = (
  dishLists: any[],
  meta: Partial<{
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  }> = {}
) => ({
  dishLists,
  meta: {
    limit: 30,
    offset: 0,
    total: dishLists.length,
    hasMore: false,
    ...meta,
  },
});

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

    mockDishlistService.getDishLists.mockResolvedValueOnce(
      toPage(mockDishLists)
    );

    const { result } = renderHook(() => useDishLists({ tab: "all" }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dishLists).toEqual(mockDishLists);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("orders the default list first, followed by pinned and recent lists", () => {
    const baseDishList: Omit<DishList, "id" | "title" | "updatedAt"> = {
      recipeCount: 0,
      isOwner: true,
      isCollaborator: false,
      isFollowing: false,
      visibility: "PUBLIC",
      isDefault: false,
      isPinned: false,
      owner: { uid: "user-1" },
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const dishLists: DishList[] = [
      {
        ...baseDishList,
        id: "recent",
        title: "Recent",
        updatedAt: "2026-01-04T00:00:00.000Z",
      },
      {
        ...baseDishList,
        id: "pinned",
        title: "Pinned",
        isPinned: true,
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        ...baseDishList,
        id: "default",
        title: "My Recipes",
        isDefault: true,
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        ...baseDishList,
        id: "older",
        title: "Older",
        updatedAt: "2026-01-03T00:00:00.000Z",
      },
    ];

    expect(sortDishLists(dishLists).map((dishList) => dishList.id)).toEqual([
      "default",
      "pinned",
      "recent",
      "older",
    ]);
    expect(dishLists.map((dishList) => dishList.id)).toEqual([
      "recent",
      "pinned",
      "default",
      "older",
    ]);
  });

  it("does not show the previous tab's data while a new tab loads", async () => {
    const allDishList = {
      id: "owned",
      title: "Owned",
      recipeCount: 0,
      isOwner: true,
      isCollaborator: false,
      isFollowing: false,
      visibility: "PUBLIC" as const,
      isDefault: false,
      isPinned: false,
      owner: { uid: "user-1" },
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    const collaboration = {
      ...allDishList,
      id: "collaboration",
      title: "Collaboration",
      isOwner: false,
      isCollaborator: true,
    };
    let resolveCollaborations!: (page: ReturnType<typeof toPage>) => void;
    const collaborationsRequest = new Promise<ReturnType<typeof toPage>>(
      (resolve) => {
        resolveCollaborations = resolve;
      }
    );

    mockDishlistService.getDishLists
      .mockResolvedValueOnce(toPage([allDishList]))
      .mockImplementationOnce(() => collaborationsRequest);

    const { result, rerender } = renderHook(
      ({ tab }: { tab: DishListTab }) => useDishLists({ tab }),
      {
        initialProps: { tab: "all" as DishListTab },
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(result.current.dishLists.map((list) => list.id)).toEqual([
        "owned",
      ]);
    });

    rerender({ tab: "collaborations" });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.dishLists).toEqual([]);

    resolveCollaborations(toPage([collaboration]));

    await waitFor(() => {
      expect(result.current.dishLists.map((list) => list.id)).toEqual([
        "collaboration",
      ]);
    });
  });

  it("should fetch and merge subsequent pages", async () => {
    const firstPage = [
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
    const secondPage = [
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

    mockDishlistService.getDishLists
      .mockResolvedValueOnce(
        toPage(firstPage, { limit: 1, offset: 0, total: 2, hasMore: true })
      )
      .mockResolvedValueOnce(
        toPage(secondPage, { limit: 1, offset: 1, total: 2, hasMore: false })
      );

    const { result } = renderHook(() => useDishLists({ tab: "all" }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dishLists).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.dishLists).toHaveLength(2);
    });

    expect(result.current.dishLists.map((list) => list.id)).toEqual([
      "1",
      "2",
    ]);
    expect(result.current.hasNextPage).toBe(false);
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

    mockDishlistService.getDishLists.mockResolvedValueOnce(
      toPage(mockDishLists)
    );

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
    mockDishlistService.getDishLists.mockRejectedValue(
      new Error("Network error")
    );

    const { result } = renderHook(() => useDishLists({ tab: "all" }), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 5000 }
    );

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

    mockDishlistService.getDishLists.mockResolvedValueOnce(
      toPage(mockDishLists)
    );

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
