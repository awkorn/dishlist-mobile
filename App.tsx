import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./src/providers/AuthProvider/AuthContext";
import MainNavigator from "./src/navigation/MainNavigator";
import { useCustomFonts } from "./src/hooks/useFonts";
import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { GlobalErrorBoundary } from "./src/providers/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      placeholderData: (prev: unknown) => prev,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Global network monitoring
const setupNetworkMonitoring = () => {
  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      queryClient.invalidateQueries();
    }
  });
};

export default function App() {
  const fontsLoaded = useCustomFonts();

  useEffect(() => {
    setupNetworkMonitoring();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AuthProvider>
            <NavigationContainer>
              <MainNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </AuthProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}