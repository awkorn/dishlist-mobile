import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useToggleFollowDishList } from "../hooks/useDishListMutations";
import { dishlistService } from "../services";

jest.mock("../services", () => ({
  dishlistService: {
    followDishList: jest.fn(),
    unfollowDishList: jest.fn(),
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
