import React from 'react';
import { EmptyState } from '@components/ui';

interface GroceryEmptyStateProps {
  title?: string;
  message?: string;
}

export function GroceryEmptyState({
  title = 'Your list is empty',
  message = 'Tap + to add your first item',
}: GroceryEmptyStateProps) {
  return <EmptyState title={title} message={message} />;
}
