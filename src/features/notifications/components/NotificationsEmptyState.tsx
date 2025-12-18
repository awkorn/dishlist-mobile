import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

export function NotificationsEmptyState() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Bell size={48} color={theme.colors.neutral[400]} />
      </View>
      <Text style={styles.title}>No Notifications</Text>
      <Text style={styles.subtitle}>
        When you receive notifications, they'll appear here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing['3xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
  },
});