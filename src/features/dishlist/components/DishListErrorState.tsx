import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { typography } from '@styles/typography';
import { theme } from '@styles/theme';

interface DishListErrorStateProps {
  isOffline?: boolean;
  onRetry: () => void;
}

export function DishListErrorState({ isOffline, onRetry }: DishListErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unable to Load DishLists</Text>
      <Text style={styles.text}>
        {isOffline
          ? "You're offline and no cached data is available"
          : 'Something went wrong. Please try again.'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing["2xl"],
  },
  title: {
    ...typography.heading3,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  text: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    ...typography.button,
    color: 'white',
  },
});