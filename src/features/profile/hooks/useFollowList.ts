import { useInfiniteQuery } from "@tanstack/react-query";
import { profileService } from "../services/profileService";

const FOLLOWERS_QUERY_KEY = "followers";
const FOLLOWING_QUERY_KEY = "following";
const FOLLOW_LIST_PAGE_SIZE = 20;

export function useFollowers(userId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: [FOLLOWERS_QUERY_KEY, userId],
    queryFn: ({ pageParam }) =>
      profileService.getFollowers(userId, {
        cursor: pageParam ?? undefined,
        limit: FOLLOW_LIST_PAGE_SIZE,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId && enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useFollowing(userId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: [FOLLOWING_QUERY_KEY, userId],
    queryFn: ({ pageParam }) =>
      profileService.getFollowing(userId, {
        cursor: pageParam ?? undefined,
        limit: FOLLOW_LIST_PAGE_SIZE,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!userId && enabled,
    staleTime: 30 * 1000,
  });
}

// Export query keys for cache invalidation
export { FOLLOWERS_QUERY_KEY, FOLLOWING_QUERY_KEY };
