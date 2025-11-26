import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@lib/queryKeys';
import { dishlistService } from '../services';

export function usePrefetchDishLists() {
  const queryClient = useQueryClient();

  const prefetchDishLists = useCallback(async () => {
    try {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.dishLists.list('all'),
          queryFn: () => dishlistService.getDishLists('all'),
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.dishLists.list('my'),
          queryFn: () => dishlistService.getDishLists('my'),
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