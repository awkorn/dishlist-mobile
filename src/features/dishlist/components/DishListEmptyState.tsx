import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { typography } from '@styles/typography';
import { theme } from '@styles/theme';
import type { DishListTabLabel } from '../types';

interface DishListEmptyStateProps {
  searchQuery?: string;
  activeTab: DishListTabLabel;
  onCreatePress?: () => void;
}

export function DishListEmptyState({ 
  searchQuery, 
  activeTab, 
  onCreatePress 
}: DishListEmptyStateProps) {
  const isMyDishListsTab = activeTab === 'My DishLists';
  const hasSearchQuery = !!searchQuery?.trim();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {hasSearchQuery ? 'No Results Found' : 'No DishLists Yet'}
      </Text>
      
      <Text style={styles.text}>
        {hasSearchQuery
          ? `No DishLists match "${searchQuery}"`
          : isMyDishListsTab
          ? 'Tap the + button to create your first DishList'
          : `You don't have any ${activeTab.toLowerCase()} yet`}
      </Text>

      {!hasSearchQuery && isMyDishListsTab && onCreatePress && (
        <TouchableOpacity style={styles.createButton} onPress={onCreatePress}>
          <Plus size={20} color="white" />
          <Text style={styles.createButtonText}>Create DishList</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing["4xl"],
    paddingVertical: theme.spacing["4xl"],
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[500],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  createButtonText: {
    ...typography.button,
    color: 'white',
  },
});