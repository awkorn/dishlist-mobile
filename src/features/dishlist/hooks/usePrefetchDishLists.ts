import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/queryKeys';
import { dishlistService, DISH_LISTS_PAGE_SIZE } from '../services';

export function usePrefetchDishLists() {
  const queryClient = useQueryClient();

  const prefetchDishLists = useCallback(async () => {
    try {
      await Promise.all([
        queryClient.prefetchInfiniteQuery({
          queryKey: queryKeys.dishLists.list('all'),
          queryFn: () =>
            dishlistService.getDishLists('all', {
              limit: DISH_LISTS_PAGE_SIZE,
              offset: 0,
            }),
          initialPageParam: 0,
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchInfiniteQuery({
          queryKey: queryKeys.dishLists.list('my'),
          queryFn: () =>
            dishlistService.getDishLists('my', {
              limit: DISH_LISTS_PAGE_SIZE,
              offset: 0,
            }),
          initialPageParam: 0,
          staleTime: 5 * 60 * 1000,
        }),
      ]);
      return true;
    } catch (error) {
      console.warn('DishLists prefetch failed:', error);
      return false;
    }
  }, [queryClient]);

  return { prefetchDishLists };
}