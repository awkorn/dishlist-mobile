import React from "react";
import { act, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { PushNotificationsProvider } from "../hooks/usePushNotifications";
import { queryKeys } from "@lib/queryKeys";
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from "../services/pushService";

const mockInvalidateQueries = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock("@providers/AuthProvider/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock("../services/pushService", () => ({
  enablePushNotifications: jest.fn(),
  disablePushNotifications: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseListener: jest.fn(),
  PUSH_ENABLED_KEY: "push_enabled",
  PUSH_TOKEN_KEY: "push_token",
}));

describe("PushNotificationsProvider", () => {
  it("invalidates the notification list and badge for a foreground push", () => {
    let onReceived: (() => void) | undefined;
    const removeReceived = jest.fn();
    const removeResponse = jest.fn();

    (addNotificationReceivedListener as jest.Mock).mockImplementation(
      (callback: () => void) => {
        onReceived = callback;
        return { remove: removeReceived };
      }
    );
    (addNotificationResponseListener as jest.Mock).mockReturnValue({
      remove: removeResponse,
    });

    const view = render(
      <PushNotificationsProvider>
        <Text>Notifications enabled</Text>
      </PushNotificationsProvider>
    );

    act(() => {
      onReceived?.();
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.notifications.all,
    });

    view.unmount();
    expect(removeReceived).toHaveBeenCalled();
    expect(removeResponse).toHaveBeenCalled();
  });
});
