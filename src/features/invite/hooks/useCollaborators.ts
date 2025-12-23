import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteService } from '../services/inviteService';
import { queryKeys } from '@lib/queryKeys';
import type { CollaboratorsResponse } from '../types';

interface UseCollaboratorsOptions {
  dishListId: string;
  enabled?: boolean;
}

export function useCollaborators({ dishListId, enabled = true }: UseCollaboratorsOptions) {
  const queryClient = useQueryClient();

  // Query key for collaborators
  const collaboratorsQueryKey = ['dishlist', dishListId, 'collaborators'];

  // Fetch collaborators and pending invites
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<CollaboratorsResponse>({
    queryKey: collaboratorsQueryKey,
    queryFn: () => inviteService.getCollaborators(dishListId),
    enabled: enabled && !!dishListId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: (userId: string) => inviteService.removeCollaborator(dishListId, userId),
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: collaboratorsQueryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.detail(dishListId) });
      Alert.alert('Success', 'Collaborator removed');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to remove collaborator');
    },
  });

  // Revoke invite mutation
  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => inviteService.revokeInvite(dishListId, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaboratorsQueryKey });
      Alert.alert('Success', 'Invite revoked');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to revoke invite');
    },
  });

  // Resend invite mutation
  const resendInviteMutation = useMutation({
    mutationFn: (inviteId: string) => inviteService.resendInvite(dishListId, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collaboratorsQueryKey });
      Alert.alert('Success', 'Invite resent');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.error || 'Failed to resend invite');
    },
  });

  // Action handlers with confirmation
  const handleRemoveCollaborator = useCallback((userId: string, userName: string) => {
    Alert.alert(
      'Remove Collaborator',
      `Are you sure you want to remove ${userName} from this DishList?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeCollaboratorMutation.mutate(userId),
        },
      ]
    );
  }, [removeCollaboratorMutation]);

  const handleRevokeInvite = useCallback((inviteId: string, userName: string) => {
    Alert.alert(
      'Revoke Invite',
      `Are you sure you want to revoke the invite for ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => revokeInviteMutation.mutate(inviteId),
        },
      ]
    );
  }, [revokeInviteMutation]);

  const handleResendInvite = useCallback((inviteId: string) => {
    resendInviteMutation.mutate(inviteId);
  }, [resendInviteMutation]);

  return {
    // Data
    owner: data?.owner,
    collaborators: data?.collaborators || [],
    pendingInvites: data?.pendingInvites || [],
    isOwner: data?.isOwner || false,
    totalCount: data?.totalCount || 0,

    // Loading states
    isLoading,
    isError,
    isRemoving: removeCollaboratorMutation.isPending,
    isRevoking: revokeInviteMutation.isPending,
    isResending: resendInviteMutation.isPending,

    // Actions
    refetch,
    handleRemoveCollaborator,
    handleRevokeInvite,
    handleResendInvite,
  };
}