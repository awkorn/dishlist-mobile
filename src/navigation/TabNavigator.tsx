import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
const TAB_BAR_CONTENT_HEIGHT = 60;

// Wrapper component for notification icon with badge
function NotificationTabIcon({ color, size }: { color: string; size: number }) {
  const { count } = useUnreadCount();
  return <NotificationBadge count={count} color={color} size={size} />;
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

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
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 12,
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
