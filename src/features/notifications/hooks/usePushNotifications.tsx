import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import {
  enablePushNotifications,
  disablePushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  PUSH_ENABLED_KEY,
  PUSH_TOKEN_KEY,
} from "../services/pushService";

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface PushNotificationsContextValue {
  pushEnabled: boolean;
  togglePush: (enable: boolean) => Promise<void>;
  isLoading: boolean;
}

const PushNotificationsContext =
  createContext<PushNotificationsContextValue | null>(null);

/**
 * Owns the push notification lifecycle for the whole app:
 * - Auto-registers on mount if previously enabled
 * - Handles notification tap navigation
 * - Provides toggle controls for settings
 *
 * Must be mounted exactly ONCE, inside the NavigationContainer (it navigates
 * on notification taps). Consumers read shared state via usePushNotifications —
 * a second mount would register duplicate tap listeners and navigate twice.
 */
export function PushNotificationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.id;
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<Nav>();
  const tokenRef = useRef<string | null>(null);

  // Restore saved preference on mount
  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      AsyncStorage.getItem(PUSH_ENABLED_KEY),
      AsyncStorage.getItem(PUSH_TOKEN_KEY),
    ])
      .then(([enabledValue, token]) => {
        if (cancelled) return;
        setPushEnabled(enabledValue === "true");
        tokenRef.current = token;
      })
      .catch((error) =>
        console.error("Failed to restore push notification settings:", error)
      )
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Register for whichever account is currently authenticated. This reruns
  // when accounts change without requiring an app restart.
  useEffect(() => {
    if (isLoading || !userId || !pushEnabled) return;

    let cancelled = false;
    void enablePushNotifications()
      .then(async (token) => {
        if (cancelled || !token) return;
        tokenRef.current = token;
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      })
      .catch((error) =>
        console.error("Failed to register push notifications:", error)
      );

    return () => {
      cancelled = true;
    };
  }, [isLoading, pushEnabled, userId]);

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
        case "RECIPE_IMPORT_COMPLETED":
          if (data.recipeId) {
            navigation.navigate("RecipeDetail", {
              recipeId: data.recipeId as string,
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

  const togglePush = useCallback(
    async (enable: boolean) => {
      const previous = pushEnabled;
      setPushEnabled(enable);

      try {
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
            Alert.alert(
              "Notifications Disabled",
              "Enable notifications for DishList in your device settings to receive push notifications."
            );
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
      } catch (error) {
        // Revert so the switch never shows a state the backend doesn't have —
        // e.g. "off" while the token is still registered and pushes keep coming.
        console.error("Failed to update push notification setting:", error);
        setPushEnabled(previous);
        await AsyncStorage.setItem(PUSH_ENABLED_KEY, String(previous)).catch(
          () => undefined
        );
        Alert.alert(
          "Error",
          enable
            ? "Failed to enable push notifications. Please try again."
            : "Failed to disable push notifications. Please try again."
        );
      }
    },
    [pushEnabled]
  );

  return (
    <PushNotificationsContext.Provider
      value={{ pushEnabled, togglePush, isLoading }}
    >
      {children}
    </PushNotificationsContext.Provider>
  );
}

/**
 * Read the shared push notification state (see PushNotificationsProvider).
 */
export function usePushNotifications(): PushNotificationsContextValue {
  const context = useContext(PushNotificationsContext);
  if (!context) {
    throw new Error(
      "usePushNotifications must be used within a PushNotificationsProvider"
    );
  }
  return context;
}
