import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { profileService } from '../services/profileService';
import { PROFILE_QUERY_KEY } from './useProfile';
import type { ProfileData } from '../types';

interface UseFollowUserOptions {
  userId: string;
  isFollowing: boolean;
}

export function useFollowUser({ userId, isFollowing }: UseFollowUserOptions) {
  const queryClient = useQueryClient();
  const profileQueryKey = [PROFILE_QUERY_KEY, userId];

  return useMutation({
    mutationFn: () =>
      isFollowing
        ? profileService.unfollowUser(userId)
        : profileService.followUser(userId),

    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileQueryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ProfileData>(profileQueryKey);

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<ProfileData>(profileQueryKey, {
          ...previousData,
          user: {
            ...previousData.user,
            isFollowing: !isFollowing,
            followerCount: previousData.user.followerCount + (isFollowing ? -1 : 1),
          },
        });
      }

      return { previousData };
    },

    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(profileQueryKey, context.previousData);
      }
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to update follow status'
      );
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
}