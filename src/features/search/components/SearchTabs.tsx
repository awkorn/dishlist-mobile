import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import type { SearchTab } from "../types";

interface SearchTabsProps {
  activeTab: SearchTab;
  onTabChange: (tab: SearchTab) => void;
}

const TABS: { key: SearchTab; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "users", label: "USERS" },
  { key: "recipes", label: "RECIPES" },
  { key: "dishlists", label: "DISHLISTS" },
];

export function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  tab: {
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.sm,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary[600],
  },
  tabText: {
    ...typography.body,
    fontSize: 14,
    color: theme.colors.neutral[500],
  },
  activeTabText: {
    color: theme.colors.primary[600],
    fontWeight: "600",
  },
});