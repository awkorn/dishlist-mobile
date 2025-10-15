import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  BookOpen,
  ShoppingCart,
  Search,
  PlusSquare,
  User,
} from "lucide-react-native";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "../styles/theme";
import DishListsScreen from "../screens/main/DishListsScreen";
import GroceryListScreen from "../screens/main/GroceryListScreen";

const Tab = createBottomTabNavigator();

// Placeholder screens for tabs we haven't built yet
const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>{title} - Coming Soon!</Text>
  </View>
);

const SearchScreen = () => <PlaceholderScreen title="Search" />;
const BuilderScreen = () => <PlaceholderScreen title="Recipe Builder" />;
const ProfileScreen = () => <PlaceholderScreen title="Profile" />;

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.secondary[50],
        tabBarInactiveTintColor: theme.colors.neutral[500],
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.neutral[200],
          height: 90, // Adjust based on your design
          paddingBottom: 30, // iOS safe area
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 0, // Hide labels, only show icons
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="DishListsTab"
        component={DishListsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GroceryTab"
        component={GroceryListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="BuilderTab"
        component={BuilderScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <PlusSquare size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "600",
  },
});