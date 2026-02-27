import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';

interface GroceryEmptyStateProps {
  title?: string;
  message?: string;
}

export function GroceryEmptyState({
  title = 'Your list is empty',
  message = 'Tap + to add your first item',
}: GroceryEmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: '40%',
    paddingHorizontal: theme.spacing['4xl'],
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
  },
  title: {
    ...typography.subtitle,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: 'center',
  },
});