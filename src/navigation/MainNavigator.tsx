import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../providers/AuthProvider/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import CreateDishListScreen from "../screens/main/CreateDishListScreen";
import DishListDetailScreen from "../screens/main/DishListDetailScreen";
import AddRecipeScreen from "../screens/main/AddRecipeScreen";
import RecipeDetailScreen from "../screens/main/RecipeDetailScreen";
import ProfileScreen from "../screens/main/ProfileScreen";
import TabNavigator from "./TabNavigator";
import { RootStackParamList } from "../types/navigation";

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
          {/* Main Tabs - This is the home screen */}
          <Stack.Screen name="Home" component={TabNavigator} />

          {/* Modal Screens */}
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
