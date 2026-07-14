import React from 'react';
import { Plus } from 'lucide-react-native';
import Button from '@components/ui/Button';
import { EmptyState } from '@components/ui';
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
    <EmptyState
      title={hasSearchQuery ? 'No Results Found' : 'No DishLists Yet'}
      message={
        hasSearchQuery
          ? `No DishLists match "${searchQuery}"`
          : isMyDishListsTab
          ? 'Tap the + button to create your first DishList'
          : `You don't have any in ${activeTab.toLowerCase()} yet`
      }
      action={
        !hasSearchQuery && isMyDishListsTab && onCreatePress ? (
          <Button
            title="Create DishList"
            onPress={onCreatePress}
            size="sm"
            leadingIcon={<Plus size={18} color={theme.colors.onPrimary} />}
          />
        ) : undefined
      }
    />
  );
}
