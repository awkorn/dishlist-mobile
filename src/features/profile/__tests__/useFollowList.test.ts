import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFollowers, useFollowing } from "../hooks/useFollowList";
import { profileService } from "../services/profileService";

jest.mock("../services/profileService", () => ({
  profileService: {
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("follow list pagination", () => {
  beforeEach(() => {
    (profileService.getFollowing as jest.Mock).mockResolvedValue({
      users: [],
      nextCursor: null,
    });
  });

  it("requests the next followers page using the returned cursor", async () => {
    (profileService.getFollowers as jest.Mock)
      .mockResolvedValueOnce({
        users: [{ uid: "user-1" }],
        nextCursor: "cursor-1",
      })
      .mockResolvedValueOnce({
        users: [{ uid: "user-2" }],
        nextCursor: null,
      });

    const { result } = renderHook(() => useFollowers("profile-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(1);
    });

    await act(async () => {
      await result.current.fetchNextPage();
    });

    expect(profileService.getFollowers).toHaveBeenNthCalledWith(
      1,
      "profile-1",
      { cursor: undefined, limit: 20 }
    );
    expect(profileService.getFollowers).toHaveBeenNthCalledWith(
      2,
      "profile-1",
      { cursor: "cursor-1", limit: 20 }
    );
    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  it("bounds the initial following request", async () => {
    const { result } = renderHook(() => useFollowing("profile-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(profileService.getFollowing).toHaveBeenCalledWith("profile-1", {
      cursor: undefined,
      limit: 20,
    });
  });
});
