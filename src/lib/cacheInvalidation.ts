import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { PROFILE_QUERY_KEY } from '@features/profile/hooks/useProfile';

/**
 * Centralized cache invalidation helpers
 * Use these to ensure consistent cache updates across the app
 */

/**
 * Invalidate all caches related to a user's follow status
 * Call this after follow/unfollow actions
 */
export function invalidateFollowRelatedCaches(
  queryClient: QueryClient,
  userId: string
) {
  // User's profile
  queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY, userId] });
  
  // All search results (may contain this user with stale follow status)
  queryClient.invalidateQueries({ queryKey: queryKeys.search.all });
}

/**
 * Invalidate all caches related to the current user's profile
 * Call this after profile edits
 */
export function invalidateCurrentUserCaches(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
  queryClient.invalidateQueries({ queryKey: queryKeys.search.all });
}

/**
 * Invalidate all caches related to a DishList
 * Call this after dishlist mutations
 */
export function invalidateDishListRelatedCaches(
  queryClient: QueryClient,
  dishListId: string
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.detail(dishListId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.search.all });
}