import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface SearchErrorStateProps {
  onRetry: () => void;
}

export function SearchErrorState({ onRetry }: SearchErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Couldn't load results</Text>
      <Text style={styles.message}>
        Please check your connection and try again.
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry search"
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
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
    color: theme.colors.neutral[600],
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    ...typography.button,
    color: theme.colors.onPrimary,
  },
});
