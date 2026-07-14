import React from 'react';
import { EmptyState } from '@components/ui';

interface ProfileEmptyStateProps {
  message: string;
}

export function ProfileEmptyState({ message }: ProfileEmptyStateProps) {
  return <EmptyState message={message} />;
}
