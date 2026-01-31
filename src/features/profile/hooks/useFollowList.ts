import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/profileService';

const FOLLOWERS_QUERY_KEY = 'followers';
const FOLLOWING_QUERY_KEY = 'following';

export function useFollowers(userId: string) {
  return useQuery({
    queryKey: [FOLLOWERS_QUERY_KEY, userId],
    queryFn: () => profileService.getFollowers(userId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useFollowing(userId: string) {
  return useQuery({
    queryKey: [FOLLOWING_QUERY_KEY, userId],
    queryFn: () => profileService.getFollowing(userId),
    staleTime: 30 * 1000,
  });
}

// Export query keys for cache invalidation
export { FOLLOWERS_QUERY_KEY, FOLLOWING_QUERY_KEY };