import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { queryKeys } from "@lib/queryKeys";
import { profileService } from "../services/profileService";
import { PROFILE_QUERY_KEY } from "./useProfile";
import type { ProfileData } from "../types";

interface UseBlockUserOptions {
  userId: string;
}

export function useBlockUser({ userId }: UseBlockUserOptions) {
  const queryClient = useQueryClient();
  const profileQueryKey = [PROFILE_QUERY_KEY, userId];

  const invalidateBlockedUserCaches = () => {
    queryClient.invalidateQueries({ queryKey: profileQueryKey });
    queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unread() });
    queryClient.invalidateQueries({ queryKey: queryKeys.search.all });
  };

  const blockMutation = useMutation({
    mutationFn: () => profileService.blockUser(userId),
    onSuccess: () => {
      queryClient.setQueryData<ProfileData | undefined>(
        profileQueryKey,
        (previousData) =>
          previousData
            ? {
                ...previousData,
                user: {
                  uid: previousData.user.uid,
                  followerCount: 0,
                  followingCount: 0,
                  isFollowing: false,
                  isOwnProfile: false,
                  followStatus: "NONE",
                  blockStatus: "BLOCKED_BY_ME",
                },
                dishlists: [],
                recipes: [],
              }
            : previousData
      );
      invalidateBlockedUserCaches();
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to block user"
      );
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => profileService.unblockUser(userId),
    onSuccess: invalidateBlockedUserCaches,
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to unblock user"
      );
    },
  });

  return {
    block: blockMutation.mutate,
    unblock: unblockMutation.mutate,
    isPending: blockMutation.isPending || unblockMutation.isPending,
  };
}
