import { useState, useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@features/search/hooks/useDebouncedValue";
import { searchService } from "../services/searchService";
import { queryKeys } from "@lib/queryKeys";
import type { SearchTab, SearchResponse, SearchUser, SearchRecipe, SearchDishList } from "../types";

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

interface UseSearchOptions {
  initialTab?: SearchTab;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { initialTab = "all" } = options;

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);

  // Debounce the search query
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);

  // Build query key for React Query
  const searchQueryKey = useMemo(
    () => queryKeys.search.results(debouncedQuery, activeTab),
    [debouncedQuery, activeTab]
  );

  // Infinite query for paginated results
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: searchQueryKey,
    queryFn: async ({ pageParam }) => {
      return searchService.search({
        query: debouncedQuery,
        tab: activeTab,
        cursor: pageParam as string | undefined,
        limit: PAGE_SIZE,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: debouncedQuery.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Flatten paginated results
  const users = useMemo<SearchUser[]>(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.users);
  }, [data]);

  const recipes = useMemo<SearchRecipe[]>(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.recipes);
  }, [data]);

  const dishLists = useMemo<SearchDishList[]>(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.dishLists);
  }, [data]);

  // Check if there are any results
  const hasResults = users.length > 0 || recipes.length > 0 || dishLists.length > 0;
  const isEmpty = debouncedQuery.length > 0 && !isLoading && !hasResults;

  // Handle tab change
  const handleTabChange = useCallback((tab: SearchTab) => {
    setActiveTab(tab);
  }, []);

  // Handle query change
  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery("");
  }, []);

  // Load more results (for infinite scroll)
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    // State
    query,
    debouncedQuery,
    activeTab,

    // Results
    users,
    recipes,
    dishLists,
    hasResults,
    isEmpty,

    // Loading states
    isLoading: isLoading && debouncedQuery.length > 0,
    isFetching,
    isFetchingNextPage,
    isError,
    error,

    // Pagination
    hasNextPage: hasNextPage ?? false,
    loadMore,

    // Actions
    setQuery: handleQueryChange,
    setActiveTab: handleTabChange,
    clearSearch,
    refetch,
  };
}