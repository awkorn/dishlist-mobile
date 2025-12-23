import { useState, useCallback, useMemo } from 'react';
import { Alert, Share, Clipboard } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { shareService } from '@features/share/services';
import { inviteService } from '../services/inviteService';
import { queryKeys } from '@lib/queryKeys';
import type { MutualUser } from '@features/share/types';

interface UseInviteCollaboratorOptions {
  dishListId: string;
  dishListTitle: string;
  onInviteSuccess?: () => void;
}

export function useInviteCollaborator({
  dishListId,
  dishListTitle,
  onInviteSuccess,
}: UseInviteCollaboratorOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Fetch mutuals (reuse share service)
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
    return mutuals.filter((user: MutualUser) => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const username = (user.username || '').toLowerCase();
      return fullName.includes(query) || username.includes(query);
    });
  }, [mutuals, searchQuery]);

  // Send invites mutation
  const inviteMutation = useMutation({
    mutationFn: async (recipientIds: string[]) => {
      return inviteService.sendInvites({
        dishListId,
        recipientIds,
      });
    },
    onSuccess: (data) => {
      const parts: string[] = [];
      if (data.invited > 0) {
        parts.push(`${data.invited} ${data.invited === 1 ? 'invite' : 'invites'} sent`);
      }
      if (data.resent > 0) {
        parts.push(`${data.resent} ${data.resent === 1 ? 'invite' : 'invites'} resent`);
      }
      if (data.alreadyCollaborator > 0) {
        parts.push(`${data.alreadyCollaborator} already collaborating`);
      }

      const message = parts.length > 0 ? parts.join(', ') : 'Invites processed';

      Alert.alert('Invites Sent!', message);
      setSelectedUserIds(new Set());
      onInviteSuccess?.();
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to send invites. Please try again.'
      );
    },
  });

  // Generate link mutation
  const generateLinkMutation = useMutation({
    mutationFn: () => inviteService.generateInviteLink(dishListId),
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to generate invite link.'
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
      Alert.alert('No Recipients', 'Please select at least one person to invite.');
      return;
    }
    inviteMutation.mutate(Array.from(selectedUserIds));
  }, [selectedUserIds, inviteMutation]);

  // Share via native share sheet (text/message)
  const handleShareViaMessage = useCallback(async () => {
    try {
      const result = await generateLinkMutation.mutateAsync();
      const message = `Join me as a collaborator on "${dishListTitle}"!\n${result.link}`;

      await Share.share({
        message,
        title: `Collaborate on ${dishListTitle}`,
      });
    } catch (error) {
      // Error handled in mutation
      console.error('Share via message error:', error);
    }
  }, [dishListTitle, generateLinkMutation]);

  // Copy invite link to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      const result = await generateLinkMutation.mutateAsync();
      Clipboard.setString(result.link);
      Alert.alert('Link Copied', 'The invite link has been copied to your clipboard.');
    } catch (error) {
      // Error handled in mutation
      console.error('Copy link error:', error);
    }
  }, [generateLinkMutation]);

  return {
    // State
    searchQuery,
    setSearchQuery,
    selectedUserIds,
    filteredMutuals,

    // Loading states
    isLoadingMutuals,
    isSending: inviteMutation.isPending,
    isGeneratingLink: generateLinkMutation.isPending,

    // Actions
    toggleUserSelection,
    clearSelection,
    handleSendToSelected,
    handleShareViaMessage,
    handleCopyLink,
    refetchMutuals,

    // Computed
    hasSelection: selectedUserIds.size > 0,
    selectionCount: selectedUserIds.size,
  };
}