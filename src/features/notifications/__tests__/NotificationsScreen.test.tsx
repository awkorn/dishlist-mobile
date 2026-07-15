import React from "react";
import { render } from "@testing-library/react-native";
import NotificationsScreen from "../screens/NotificationsScreen";
import { queryKeys } from "@lib/queryKeys";

const mockInvalidateQueries = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void) => callback(),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return { LinearGradient: View };
});

jest.mock("../hooks/useNotifications", () => ({
  getSectionTitle: (section: string, count: number) => `${section} (${count})`,
  useNotifications: () => ({
    groupedNotifications: {
      new: [],
      today: [],
      yesterday: [],
      earlier_this_week: [],
      earlier: [],
    },
    hasNotifications: false,
    isLoading: false,
    isError: false,
    isRefetching: false,
    isFetchingNextPage: false,
    refetch: jest.fn(),
    handleLoadMore: jest.fn(),
    handleDelete: jest.fn(),
    handleClearAll: jest.fn(),
    handleAcceptInvitation: jest.fn(),
    handleDeclineInvitation: jest.fn(),
    handleMarkAsRead: jest.fn(),
    pendingActionId: null,
    isAccepting: false,
    isDeclining: false,
    isClearing: false,
    handleAcceptFollow: jest.fn(),
    handleDeclineFollow: jest.fn(),
    isAcceptingFollow: false,
    isDecliningFollow: false,
  }),
}));

describe("NotificationsScreen", () => {
  it("refreshes the notification list and badge when the tab gains focus", () => {
    render(<NotificationsScreen />);

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.all,
    });
  });
});
