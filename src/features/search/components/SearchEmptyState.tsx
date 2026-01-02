import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface SearchEmptyStateProps {
  query: string;
}

export function SearchEmptyState({ query }: SearchEmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No results found</Text>
      <Text style={styles.message}>
        We couldn't find anything matching "{query}"
      </Text>
      <Text style={styles.suggestion}>
        Try adjusting your search or check the spelling
      </Text>
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
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  message: {
    ...typography.body,
    color: theme.colors.neutral[600],
    textAlign: "center",
  },
  suggestion: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
});