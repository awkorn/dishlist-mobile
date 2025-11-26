import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';

interface ProfileEmptyStateProps {
  message: string;
}

export function ProfileEmptyState({ message }: ProfileEmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[600],
    textAlign: 'center',
  },
});