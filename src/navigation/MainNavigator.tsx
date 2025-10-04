import React, { useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../providers/AuthProvider/AuthContext";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import DishListsScreen from "../screens/main/DishListsScreen";
import CreateDishListScreen from "../screens/main/CreateDishListScreen";
import DishListDetailScreen from "../screens/main/DishListDetailScreen";
import BottomNavigation from "../components/navigation/BottomNavigation";
import { RootStackParamList } from "../types/navigation";
import AddRecipeScreen from "../screens/main/AddRecipeScreen";
import RecipeDetailScreen from "../screens/main/RecipeDetailScreen";
import { usePrefetchDishLists } from "../hooks/usePrefetchDishLists";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Temporary placeholder screens for other tabs
const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.container}>
    <Text style={styles.text}>{title} - Coming Soon!</Text>
  </View>
);

const LoadingScreen = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#2563eb" />
  </View>
);

const AuthenticatedApp = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState("dishlist");
  const { prefetchDishLists } = usePrefetchDishLists();
  const [isPrefetching, setIsPrefetching] = useState(true);

  // Prefetch data when user logs in
  useEffect(() => {
    const prefetch = async () => {
      setIsPrefetching(true);
      await prefetchDishLists();
      setIsPrefetching(false);
    };

    // Small delay to let auth settle
    const timer = setTimeout(prefetch, 500);
    return () => clearTimeout(timer);
  }, []);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case "dishlist":
        return (
          <DishListsScreen
            navigation={navigation}
            isPrefetching={isPrefetching}
          />
        );
      case "grocery":
        return <PlaceholderScreen title="Grocery List" />;
      case "search":
        return <PlaceholderScreen title="Search" />;
      case "builder":
        return <PlaceholderScreen title="Recipe Builder" />;
      case "profile":
        return <PlaceholderScreen title="Profile" />;
      default:
        return (
          <DishListsScreen
            navigation={navigation}
            isPrefetching={isPrefetching}
          />
        );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {renderActiveScreen()}
      <BottomNavigation activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
  },
});

export default function MainNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Group>
          <Stack.Screen name="Home" component={AuthenticatedApp} />
          <Stack.Screen
            name="CreateDishList"
            component={CreateDishListScreen}
            options={{
              presentation: "modal",
              gestureEnabled: true,
              gestureDirection: "vertical",
            }}
          />
          <Stack.Screen
            name="EditDishList"
            component={CreateDishListScreen} // Reusing screen for edit
            options={{
              presentation: "modal",
              gestureEnabled: true,
              gestureDirection: "vertical",
            }}
          />
          <Stack.Screen
            name="DishListDetail"
            component={DishListDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddRecipe"
            component={AddRecipeScreen}
            options={{
              presentation: "modal",
              gestureEnabled: true,
              gestureDirection: "vertical",
            }}
          />
          <Stack.Screen
            name="RecipeDetail"
            component={RecipeDetailScreen}
            options={{ headerShown: false }}
          />
        </Stack.Group>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
