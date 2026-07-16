import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { api } from "@services/api";
import {
  PUSH_TOKEN_KEY,
  unregisterCurrentDevicePushToken,
} from "../services/pushService";

jest.mock("expo-notifications", () => ({
  AndroidImportance: { MAX: 5 },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock("expo-device", () => ({
  isDevice: true,
}));

jest.mock("expo-constants", () => ({
  expoConfig: { extra: { eas: { projectId: "test-project" } } },
}));

jest.mock("@services/api", () => ({
  api: {
    delete: jest.fn(),
  },
}));

const foregroundNotificationHandler = (
  Notifications.setNotificationHandler as jest.Mock
).mock.calls[0][0].handleNotification;

describe("pushService foreground presentation", () => {
  it("suppresses duplicate import banners while keeping the notification in the list", async () => {
    const result = await foregroundNotificationHandler({
      request: {
        content: { data: { type: "RECIPE_IMPORT_COMPLETED" } },
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldShowBanner: false,
        shouldShowList: true,
      })
    );
  });

  it("continues to show other foreground notifications", async () => {
    const result = await foregroundNotificationHandler({
      request: { content: { data: { type: "RECIPE_SHARED" } } },
    });

    expect(result).toEqual(
      expect.objectContaining({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldShowBanner: true,
      })
    );
  });
});

describe("pushService logout cleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("unregisters and removes the current device token", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      "ExponentPushToken[test]"
    );
    (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    await unregisterCurrentDevicePushToken();

    expect(api.delete).toHaveBeenCalledWith("/push-tokens", {
      data: { token: "ExponentPushToken[test]" },
    });
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(PUSH_TOKEN_KEY);
  });

  it("keeps the token so sign out can be retried when unregistering fails", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      "ExponentPushToken[test]"
    );
    (api.delete as jest.Mock).mockRejectedValueOnce(new Error("offline"));

    await expect(unregisterCurrentDevicePushToken()).rejects.toThrow("offline");
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });
});
