import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface NotificationSectionHeaderProps {
  title: string;
}

export function NotificationSectionHeader({ title }: NotificationSectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  title: {
    ...typography.caption,
    fontWeight: "600",
    color: theme.colors.neutral[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});