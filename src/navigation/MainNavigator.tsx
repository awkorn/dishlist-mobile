import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";

import { LoginScreen, SignUpScreen } from "@features/auth";
import { ProfileScreen } from "@features/profile";
import {
  DishListsScreen,
  DishListDetailScreen,
  CreateDishListScreen,
} from "@features/dishlist";
import { AddRecipeScreen, RecipeDetailScreen } from "@features/recipe";
import TabNavigator from "./TabNavigator";
import { RootStackParamList } from "@app-types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2563eb" />
  </View>
);

export default function MainNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Group>
          <Stack.Screen name="Home" component={TabNavigator} />
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
            component={CreateDishListScreen}
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
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
