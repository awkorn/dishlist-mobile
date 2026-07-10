import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@lib/queryKeys";
import {
  useToggleFollowDishList,
  useTogglePinDishList,
  useUpdateDishList,
} from "../hooks/useDishListMutations";
import { sortDishLists } from "../hooks/useDishLists";
import { dishlistService } from "../services";
import type { DishListDetailCache, DishListsCache } from "../hooks";
import type { DishList, DishListDetail } from "../types";

jest.mock("../services", () => ({
  dishlistService: {
    followDishList: jest.fn(),
    unfollowDishList: jest.fn(),
    pinDishList: jest.fn(),
    unpinDishList: jest.fn(),
    updateDishList: jest.fn(),
  },
}));

const mockDishlistService = dishlistService as jest.Mocked<
  typeof dishlistService
>;

describe("useToggleFollowDishList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );

  it("follows a DishList when the user is not currently following it", async () => {
    mockDishlistService.followDishList.mockResolvedValueOnce();

    const { result } = renderHook(() => useToggleFollowDishList(), { wrapper });

    act(() => {
      result.current.mutate({
        dishListId: "dishlist-1",
        isFollowing: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDishlistService.followDishList).toHaveBeenCalledWith("dishlist-1");
    expect(mockDishlistService.unfollowDishList).not.toHaveBeenCalled();
  });

  it("unfollows a DishList when the user is currently following it", async () => {
    mockDishlistService.unfollowDishList.mockResolvedValueOnce();

    const { result } = renderHook(() => useToggleFollowDishList(), { wrapper });

    act(() => {
      result.current.mutate({
        dishListId: "dishlist-1",
        isFollowing: true,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockDishlistService.unfollowDishList).toHaveBeenCalledWith(
      "dishlist-1",
    );
    expect(mockDishlistService.followDishList).not.toHaveBeenCalled();
  });
});

describe("useTogglePinDishList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );

  it("optimistically pins and reorders a list in the Following tab", async () => {
    const makeDishList = (overrides: Partial<DishList>): DishList => ({
      id: "dishlist",
      title: "DishList",
      visibility: "PUBLIC",
      isDefault: false,
      isPinned: false,
      recipeCount: 0,
      isOwner: false,
      isCollaborator: false,
      isFollowing: true,
      owner: { uid: "user-2" },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ...overrides,
    });
    const followingCache: DishListsCache = {
      pages: [
        {
          dishLists: [
            makeDishList({
              id: "default",
              title: "My Recipes",
              isDefault: true,
              isOwner: true,
            }),
            makeDishList({
              id: "existing-pin",
              isPinned: true,
              updatedAt: "2026-01-02T00:00:00.000Z",
            }),
            makeDishList({
              id: "new-pin",
              updatedAt: "2026-01-03T00:00:00.000Z",
            }),
          ],
          meta: {
            limit: 30,
            offset: 0,
            total: 3,
            hasMore: false,
          },
        },
      ],
      pageParams: [0],
    };
    queryClient.setQueryData(
      queryKeys.dishLists.list("following"),
      followingCache,
    );
    mockDishlistService.pinDishList.mockResolvedValueOnce();

    const { result } = renderHook(() => useTogglePinDishList(), { wrapper });

    act(() => {
      result.current.mutate({ dishListId: "new-pin", isPinned: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updatedLists =
      queryClient
        .getQueryData<DishListsCache>(queryKeys.dishLists.list("following"))
        ?.pages.flatMap((page) => page.dishLists) ?? [];

    expect(updatedLists.find((list) => list.id === "new-pin")?.isPinned).toBe(
      true,
    );
    expect(sortDishLists(updatedLists).map((list) => list.id)).toEqual([
      "default",
      "new-pin",
      "existing-pin",
    ]);
  });
});

describe("useUpdateDishList", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );

  it("merges the summary response without discarding detail-only fields", async () => {
    const existingDetail: DishListDetail = {
      id: "dishlist-1",
      title: "Old title",
      visibility: "PUBLIC",
      isDefault: false,
      isPinned: true,
      recipeCount: 1,
      followerCount: 4,
      collaboratorCount: 2,
      isOwner: true,
      isCollaborator: false,
      isFollowing: false,
      owner: { uid: "user-1" },
      recipes: [
        {
          id: "recipe-1",
          title: "Soup",
          creatorId: "user-1",
          creator: { uid: "user-1" },
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
        },
      ],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    const updatedSummary: DishList = {
      id: existingDetail.id,
      title: "New title",
      visibility: "PRIVATE",
      isDefault: existingDetail.isDefault,
      isPinned: existingDetail.isPinned,
      recipeCount: existingDetail.recipeCount,
      isOwner: existingDetail.isOwner,
      isCollaborator: existingDetail.isCollaborator,
      isFollowing: existingDetail.isFollowing,
      owner: existingDetail.owner,
      createdAt: existingDetail.createdAt,
      updatedAt: "2026-01-02",
    };

    const existingCache: DishListDetailCache = {
      pages: [existingDetail],
      pageParams: [0],
    };
    queryClient.setQueryData(
      queryKeys.dishLists.detail(existingDetail.id),
      existingCache,
    );
    mockDishlistService.updateDishList.mockResolvedValueOnce(updatedSummary);

    const { result } = renderHook(() => useUpdateDishList(), { wrapper });

    act(() => {
      result.current.mutate({
        dishListId: existingDetail.id,
        title: updatedSummary.title,
        visibility: updatedSummary.visibility,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryData<DishListDetailCache>(
        queryKeys.dishLists.detail(existingDetail.id),
      )?.pages[0],
    ).toEqual({
      ...existingDetail,
      ...updatedSummary,
      recipes: existingDetail.recipes,
      followerCount: existingDetail.followerCount,
      collaboratorCount: existingDetail.collaboratorCount,
    });
  });
});
