import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  enablePushNotifications,
  disablePushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from "../services/pushService";

const PUSH_TOKEN_KEY = "@dishlist/pushToken";
const PUSH_ENABLED_KEY = "@dishlist/pushEnabled";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Hook that manages push notification lifecycle:
 * - Auto-registers on mount if previously enabled
 * - Handles notification tap navigation
 * - Provides toggle controls for settings
 */
export function usePushNotifications() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<Nav>();
  const tokenRef = useRef<string | null>(null);

  // Restore saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(PUSH_ENABLED_KEY).then((value) => {
      const enabled = value === "true";
      setPushEnabled(enabled);
      setIsLoading(false);

      if (enabled) {
        // Re-register silently (token may have changed)
        enablePushNotifications().then((token) => {
          if (token) tokenRef.current = token;
        });
      }
    });
  }, []);

  // Set up notification listeners
  useEffect(() => {
    const receivedSub = addNotificationReceivedListener(() => {
      // Notification received in foreground — no action needed,
      // the notification handler in pushService already shows the alert
    });

    const responseSub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (!data?.type) return;

      // Navigate based on notification type
      switch (data.type) {
        case "DISHLIST_INVITATION":
        case "COLLABORATION_ACCEPTED":
        case "DISHLIST_SHARED":
        case "DISHLIST_FOLLOWED":
        case "RECIPE_ADDED":
          if (data.dishListId) {
            navigation.navigate("DishListDetail", {
              dishListId: data.dishListId as string,
            });
          }
          break;
        case "FOLLOW_REQUEST":
        case "FOLLOW_ACCEPTED":
        case "USER_FOLLOWED":
          if (data.userId) {
            navigation.navigate("Profile", {
              userId: data.userId as string,
            });
          }
          break;
        default:
          // For unknown types, go to notifications tab
          navigation.navigate("Home", { screen: "NotificationsTab" } as any);
          break;
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [navigation]);

  const togglePush = useCallback(async (enable: boolean) => {
    setPushEnabled(enable);
    await AsyncStorage.setItem(PUSH_ENABLED_KEY, String(enable));

    if (enable) {
      const token = await enablePushNotifications();
      if (token) {
        tokenRef.current = token;
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      } else {
        // Permission denied — revert
        setPushEnabled(false);
        await AsyncStorage.setItem(PUSH_ENABLED_KEY, "false");
      }
    } else {
      // Unregister
      const savedToken =
        tokenRef.current ?? (await AsyncStorage.getItem(PUSH_TOKEN_KEY));
      if (savedToken) {
        await disablePushNotifications(savedToken);
        tokenRef.current = null;
        await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
      }
    }
  }, []);

  return { pushEnabled, togglePush, isLoading };
}
