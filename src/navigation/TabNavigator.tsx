import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  BookOpen,
  ShoppingCart,
  Search,
  ChefHat,
} from "lucide-react-native";
import { theme } from "../styles/theme";
import { DishListsScreen } from "@features/dishlist";
import { GroceryListScreen } from "@features/grocery";
import { SearchScreen } from "@features/search";
import { RecipeBuilderScreen } from "@features/builder";
import {
  NotificationsScreen,
  NotificationBadge,
  useUnreadCount,
} from "@features/notifications";

const Tab = createBottomTabNavigator();

// Wrapper component for notification icon with badge
function NotificationTabIcon({ color, size }: { color: string; size: number }) {
  const { count } = useUnreadCount();
  return <NotificationBadge count={count} color={color} size={size} />;
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary[600],
        tabBarInactiveTintColor: theme.colors.neutral[500],
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.neutral[200],
          height: 90,
          paddingBottom: 30,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 0,
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
        component={RecipeBuilderScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ChefHat size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <NotificationTabIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
