import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { AuthProvider } from "./src/providers/AuthProvider/AuthContext";
import MainNavigator from "./src/navigation/MainNavigator";
import { useCustomFonts } from "./src/hooks/useFonts";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import NetInfo from "@react-native-community/netinfo";
import { GlobalErrorBoundary } from "./src/providers/ErrorBoundary";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { linking } from '@navigation/linking';
import { usePushNotifications } from '@features/notifications';

function PushNotificationHandler() {
  usePushNotifications();
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // Cache kept for 30 minutes
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Don't refetch when app comes to foreground (battery)
      refetchOnReconnect: true, // Refetch when connection restored
      refetchOnMount: true, // Refetch when component mounts if stale
      networkMode: "offlineFirst", // Use cache first, then network
    },
    mutations: {
      // Writes are not universally idempotent (for example, sending a follow
      // request), so retries must be explicitly enabled by safe mutations.
      retry: false,
      retryDelay: 1000,
      networkMode: "online",
    },
  },
});

// Feed connectivity changes to React Query so refetchOnReconnect works.
// Queries themselves stay fresh until staleTime expires — a network event
// must not invalidate the whole cache.
onlineManager.setEventListener((setOnline) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    setOnline(state.isConnected ?? true);
  });
  return unsubscribe;
});

// Keep the native splash visible until fonts are ready, instead of
// flashing a blank screen with a spinner.
void SplashScreen.preventAutoHideAsync();

export default function App() {
  const fontsLoaded = useCustomFonts();

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <AuthProvider>
              <NavigationContainer linking={linking}>
                <PushNotificationHandler />
                <MainNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </AuthProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}
