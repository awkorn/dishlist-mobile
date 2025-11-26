import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@lib/queryKeys';
import { dishlistService } from '../services';
import type { DishList, DishListTab } from '../types';

interface UseDishListsOptions {
  tab: DishListTab;
  searchQuery?: string;
}

interface UseDishListsResult {
  dishLists: DishList[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  dataUpdatedAt: number;
  refetch: () => Promise<any>;
}

export function useDishLists({ tab, searchQuery = '' }: UseDishListsOptions): UseDishListsResult {
  const query = useQuery<DishList[], Error>({
    queryKey: queryKeys.dishLists.list(tab),
    queryFn: () => dishlistService.getDishLists(tab),
    staleTime: tab === 'my' ? 3 * 60 * 1000 : 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes('No internet connection')) return false;
      return failureCount < 2;
    },
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    placeholderData: (prev) => prev,
  });

  const filteredData = useMemo(() => {
    if (!query.data) return [];
    if (!searchQuery.trim()) return query.data;
    return query.data.filter((list) =>
      list.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [query.data, searchQuery]);

  return {
    dishLists: filteredData,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
  };
}