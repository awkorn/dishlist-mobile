import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface EmptyStateProps {
  title?: string;
  message: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing["3xl"],
    paddingVertical: theme.spacing["4xl"],
  },
  title: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  message: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
  },
  action: {
    marginTop: theme.spacing.lg,
  },
});
