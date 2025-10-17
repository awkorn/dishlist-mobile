import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BookOpen,
  ShoppingCart,
  Search,
  PlusSquare,
  User,
} from "lucide-react-native";
import { theme } from "../../styles/theme";

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export default function BottomNavigation({
  activeTab,
  onTabPress,
}: BottomNavigationProps) {
  const tabs = [
    { id: "dishlist", icon: BookOpen, label: "DishList" },
    { id: "search", icon: Search, label: "Search" },
    { id: "grocery", icon: ShoppingCart, label: "Grocery" },
    { id: "builder", icon: PlusSquare, label: "Builder" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.navigation}>
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => onTabPress(tab.id)}
            >
              <IconComponent
                size={24}
                color={
                  isActive
                    ? theme.colors.secondary[50]
                    : theme.colors.neutral[500]
                }
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: theme.spacing.md,
  },
  tab: {
    padding: theme.spacing.sm,
  },
});
