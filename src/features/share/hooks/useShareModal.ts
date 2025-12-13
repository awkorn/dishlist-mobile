import { useState, useCallback, useMemo } from 'react';
import { Alert, Share, Clipboard } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { shareService } from '../services/shareService';
import { queryKeys } from '@lib/queryKeys';
import type { MutualUser } from '../types';

interface UseShareModalOptions {
  shareType: 'dishlist' | 'recipe';
  contentId: string;
  contentTitle: string;
  onShareSuccess?: () => void;
}

export function useShareModal({
  shareType,
  contentId,
  contentTitle,
  onShareSuccess,
}: UseShareModalOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Fetch mutuals
  const {
    data: mutuals = [],
    isLoading: isLoadingMutuals,
    refetch: refetchMutuals,
  } = useQuery({
    queryKey: queryKeys.users.mutuals(searchQuery),
    queryFn: () => shareService.getMutuals(searchQuery || undefined),
    staleTime: 30 * 1000,
  });

  // Filter mutuals based on search (client-side for responsiveness)
  const filteredMutuals = useMemo(() => {
    if (!searchQuery.trim()) return mutuals;
    
    const query = searchQuery.toLowerCase();
    return mutuals.filter((user) => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const username = (user.username || '').toLowerCase();
      return fullName.includes(query) || username.includes(query);
    });
  }, [mutuals, searchQuery]);

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async (recipientIds: string[]) => {
      if (shareType === 'dishlist') {
        return shareService.shareDishList({
          dishListId: contentId,
          recipientIds,
        });
      }
      throw new Error('Recipe sharing not yet implemented');
    },
    onSuccess: (data) => {
      Alert.alert(
        'Shared!',
        `DishList shared with ${data.notificationsSent} ${data.notificationsSent === 1 ? 'person' : 'people'}.`
      );
      setSelectedUserIds(new Set());
      onShareSuccess?.();
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to share. Please try again.'
      );
    },
  });

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUserIds(new Set());
    setSearchQuery('');
  }, []);

  const handleSendToSelected = useCallback(() => {
    if (selectedUserIds.size === 0) {
      Alert.alert('No Recipients', 'Please select at least one person to share with.');
      return;
    }
    shareMutation.mutate(Array.from(selectedUserIds));
  }, [selectedUserIds, shareMutation]);

  const shareLink = useMemo(() => {
    return shareType === 'dishlist'
      ? shareService.generateDishListLink(contentId)
      : shareService.generateRecipeLink(contentId);
  }, [shareType, contentId]);

  const handleShareViaMessage = useCallback(async () => {
    try {
      await Share.share({
        message: `Check out this DishList: ${contentTitle}\n${shareLink}`,
        title: contentTitle,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [contentTitle, shareLink]);

  const handleCopyLink = useCallback(() => {
    Clipboard.setString(shareLink);
    Alert.alert('Link Copied', 'The link has been copied to your clipboard.');
  }, [shareLink]);

  return {
    searchQuery,
    setSearchQuery,
    selectedUserIds,
    filteredMutuals,
    isLoadingMutuals,
    isSending: shareMutation.isPending,
    toggleUserSelection,
    clearSelection,
    handleSendToSelected,
    handleShareViaMessage,
    handleCopyLink,
    refetchMutuals,
    hasSelection: selectedUserIds.size > 0,
    selectionCount: selectedUserIds.size,
  };
}