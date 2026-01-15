import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { profileService } from '../services/profileService';
import { PROFILE_QUERY_KEY } from './useProfile';
import type { ProfileData, FollowStatus } from '../types';

interface UseFollowUserOptions {
  userId: string;
}

export function useFollowUser({ userId }: UseFollowUserOptions) {
  const queryClient = useQueryClient();
  const profileQueryKey = [PROFILE_QUERY_KEY, userId];

  // Follow mutation (send request)
  const followMutation = useMutation({
    mutationFn: () => profileService.followUser(userId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: profileQueryKey });
      const previousData = queryClient.getQueryData<ProfileData>(profileQueryKey);

      // Optimistically update to pending
      if (previousData) {
        queryClient.setQueryData<ProfileData>(profileQueryKey, {
          ...previousData,
          user: {
            ...previousData.user,
            followStatus: 'PENDING',
            isFollowing: false,
          },
        });
      }

      return { previousData };
    },

    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(profileQueryKey, context.previousData);
      }
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to send follow request'
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });

  // Unfollow/Cancel mutation
  const unfollowMutation = useMutation({
    mutationFn: () => profileService.unfollowUser(userId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: profileQueryKey });
      const previousData = queryClient.getQueryData<ProfileData>(profileQueryKey);

      if (previousData) {
        const wasAccepted = previousData.user.followStatus === 'ACCEPTED';
        
        queryClient.setQueryData<ProfileData>(profileQueryKey, {
          ...previousData,
          user: {
            ...previousData.user,
            followStatus: 'NONE',
            isFollowing: false,
            // Only decrement if was actually following
            followerCount: wasAccepted 
              ? Math.max(0, previousData.user.followerCount - 1)
              : previousData.user.followerCount,
          },
        });
      }

      return { previousData };
    },

    onError: (error: any, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(profileQueryKey, context.previousData);
      }
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to update follow status'
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });

  return {
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isPending: followMutation.isPending || unfollowMutation.isPending,
  };
}