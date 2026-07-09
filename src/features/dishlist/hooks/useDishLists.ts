import { useEffect, useMemo } from 'react';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@lib/queryKeys';
import { dishlistService, DISH_LISTS_PAGE_SIZE } from '../services';
import type { DishList, DishListsPage, DishListTab } from '../types';

export type DishListsCache = InfiniteData<DishListsPage, number>;

/**
 * Apply a transform to every cached page's dishLists, preserving page
 * structure and metadata. Used by mutations for optimistic updates.
 */
export function mapDishListsCache(
  cache: DishListsCache | undefined,
  transform: (dishLists: DishList[]) => DishList[]
): DishListsCache | undefined {
  if (!cache) return cache;
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      dishLists: transform(page.dishLists),
    })),
  };
}

/**
 * Prepend a dishlist to the first cached page (optimistic create).
 */
export function prependToDishListsCache(
  cache: DishListsCache | undefined,
  dishList: DishList
): DishListsCache | undefined {
  if (!cache || cache.pages.length === 0) return cache;
  return {
    ...cache,
    pages: cache.pages.map((page, index) =>
      index === 0 ? { ...page, dishLists: [dishList, ...page.dishLists] } : page
    ),
  };
}

interface UseDishListsOptions {
  tab: DishListTab;
  searchQuery?: string;
  enabled?: boolean;
}

interface UseDishListsResult {
  dishLists: DishList[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<any>;
  dataUpdatedAt: number;
  refetch: () => Promise<any>;
}

export function useDishLists({
  tab,
  searchQuery = '',
  enabled = true,
}: UseDishListsOptions): UseDishListsResult {
  const query = useInfiniteQuery({
    queryKey: queryKeys.dishLists.list(tab),
    queryFn: ({ pageParam }) =>
      dishlistService.getDishLists(tab, {
        limit: DISH_LISTS_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: DishListsPage) =>
      lastPage.meta.hasMore
        ? lastPage.meta.offset + lastPage.meta.limit
        : undefined,
    enabled,
    staleTime: tab === 'my' ? 3 * 60 * 1000 : 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error: Error) => {
      if (error.message.includes('No internet connection')) return false;
      return failureCount < 2;
    },
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    placeholderData: (prev) => prev,
  });

  const loadedDishLists = useMemo(
    () => query.data?.pages.flatMap((page) => page.dishLists) ?? [],
    [query.data]
  );

  const trimmedSearch = searchQuery.trim();
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = query;

  // Search filters locally, so page through the rest of the collection while
  // a query is active — otherwise unloaded lists would look like non-matches.
  useEffect(() => {
    if (
      !enabled ||
      !trimmedSearch ||
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError
    ) {
      return;
    }
    void fetchNextPage();
  }, [
    enabled,
    trimmedSearch,
    loadedDishLists.length,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);

  const filteredData = useMemo(() => {
    if (!trimmedSearch) return loadedDishLists;
    return loadedDishLists.filter((list) =>
      list.title.toLowerCase().includes(trimmedSearch.toLowerCase())
    );
  }, [loadedDishLists, trimmedSearch]);

  return {
    dishLists: filteredData,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
  };
}
