import React from "react";
import { FlatList } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import FollowersFollowingScreen from "../screens/FollowersFollowingScreen";
import { useFollowers, useFollowing } from "../hooks/useFollowList";

jest.mock("react-native-pager-view", () => {
  const React = require("react");
  const { View } = require("react-native");
  const PagerView = React.forwardRef(
    ({ children }: { children: React.ReactNode }, _ref: unknown) => (
      <View>{children}</View>
    )
  );

  return { __esModule: true, default: PagerView };
});

jest.mock("../hooks/useFollowList", () => ({
  useFollowers: jest.fn(),
  useFollowing: jest.fn(),
}));

jest.mock("../components/FollowListUserItem", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    FollowListUserItem: () => React.createElement(View),
  };
});

describe("FollowersFollowingScreen", () => {
  const navigation = { goBack: jest.fn() };
  const route = {
    params: {
      userId: "user-123",
      initialTab: "followers",
      displayName: "Alex",
    },
  };

  const createQueryResult = (overrides = {}) => ({
    data: {
      pages: [{ users: [], nextCursor: null }],
      pageParams: [null],
    },
    isLoading: false,
    isError: false,
    error: null,
    isFetching: false,
    isRefetching: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    (useFollowers as jest.Mock).mockReturnValue(createQueryResult());
    (useFollowing as jest.Mock).mockReturnValue(createQueryResult());
  });

  it("shows a retryable follower error instead of an empty state", () => {
    const refetch = jest.fn();
    (useFollowers as jest.Mock).mockReturnValue(
      createQueryResult({
        data: undefined,
        isError: true,
        error: new Error("Network error"),
        refetch,
      })
    );

    const { getByText, queryByText } = render(
      <FollowersFollowingScreen
        navigation={navigation as any}
        route={route as any}
      />
    );

    expect(getByText("Unable to load followers")).toBeTruthy();
    expect(queryByText("No followers yet")).toBeNull();

    fireEvent.press(getByText("Try Again"));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("binds each list's refresh indicator to its refetch state", () => {
    const refetchFollowers = jest.fn();
    (useFollowers as jest.Mock).mockReturnValue(
      createQueryResult({
        isFetching: true,
        isRefetching: true,
        refetch: refetchFollowers,
      })
    );

    const { UNSAFE_getAllByType } = render(
      <FollowersFollowingScreen
        navigation={navigation as any}
        route={route as any}
      />
    );
    const [followersList, followingList] = UNSAFE_getAllByType(FlatList);

    expect(followersList.props.refreshing).toBe(true);
    expect(followingList.props.refreshing).toBe(false);

    fireEvent(followersList, "refresh");
    expect(refetchFollowers).toHaveBeenCalledTimes(1);
  });

  it("loads another follower page when the list reaches the end", () => {
    const fetchNextPage = jest.fn();
    (useFollowers as jest.Mock).mockReturnValue(
      createQueryResult({
        data: {
          pages: [
            {
              users: [{ uid: "follower-1", username: "first" }],
              nextCursor: "cursor-1",
            },
          ],
          pageParams: [null],
        },
        hasNextPage: true,
        fetchNextPage,
      })
    );

    const { UNSAFE_getAllByType } = render(
      <FollowersFollowingScreen
        navigation={navigation as any}
        route={route as any}
      />
    );
    const [followersList] = UNSAFE_getAllByType(FlatList);

    fireEvent(followersList, "endReached");
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });
});
