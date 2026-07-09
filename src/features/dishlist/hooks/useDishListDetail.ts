import { useEffect, useMemo } from 'react';
import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '@lib/queryKeys';
import { dishlistService, DISH_LIST_RECIPES_PAGE_SIZE } from '../services';
import { searchRecipes } from '@utils/recipeSearch';
import type { DishListDetail, DishListRecipe } from '../types';

export type DishListDetailCache = InfiniteData<DishListDetail, number>;

/**
 * Apply a transform to every cached detail page. Each page carries the full
 * dishlist metadata plus its own slice of recipes, so metadata updates must
 * touch all pages.
 */
export function mapDishListDetailCache(
  cache: DishListDetailCache | undefined,
  transform: (page: DishListDetail) => DishListDetail
): DishListDetailCache | undefined {
  if (!cache) return cache;
  return { ...cache, pages: cache.pages.map(transform) };
}

/**
 * Append a recipe to the last cached page (optimistic add).
 */
export function appendRecipeToDetailCache(
  cache: DishListDetailCache | undefined,
  recipe: DishListRecipe
): DishListDetailCache | undefined {
  if (!cache || cache.pages.length === 0) return cache;
  if (cache.pages.some((page) => page.recipes.some((r) => r.id === recipe.id))) {
    return cache;
  }
  const lastIndex = cache.pages.length - 1;
  return {
    ...cache,
    pages: cache.pages.map((page, index) => ({
      ...page,
      recipeCount: page.recipeCount + 1,
      recipes:
        index === lastIndex ? [...page.recipes, recipe] : page.recipes,
    })),
  };
}

/**
 * Remove a recipe from whichever cached page holds it (optimistic remove).
 */
export function removeRecipeFromDetailCache(
  cache: DishListDetailCache | undefined,
  recipeId: string
): DishListDetailCache | undefined {
  if (!cache) return cache;
  if (!cache.pages.some((page) => page.recipes.some((r) => r.id === recipeId))) {
    return cache;
  }
  return {
    ...cache,
    pages: cache.pages.map((page) => ({
      ...page,
      recipeCount: Math.max(page.recipeCount - 1, 0),
      recipes: page.recipes.filter((r) => r.id !== recipeId),
    })),
  };
}

interface UseDishListDetailOptions {
  dishListId: string;
  searchQuery?: string;
}

interface UseDishListDetailResult {
  dishList: DishListDetail | undefined;
  filteredRecipes: DishListRecipe[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<any>;
  error: Error | null;
  refetch: () => Promise<any>;
}

export function useDishListDetail({
  dishListId,
  searchQuery = '',
}: UseDishListDetailOptions): UseDishListDetailResult {
  const query = useInfiniteQuery({
    queryKey: queryKeys.dishLists.detail(dishListId),
    queryFn: ({ pageParam }) =>
      dishlistService.getDishListDetail(dishListId, {
        recipesLimit: DISH_LIST_RECIPES_PAGE_SIZE,
        recipesOffset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: DishListDetail) => {
      const meta = lastPage.recipesMeta;
      if (!meta?.hasMore) return undefined;
      return meta.offset + meta.limit;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!dishListId,
    placeholderData: (previousData) => previousData, // keeps old data visible during refetch
    refetchOnWindowFocus: false, // prevents refetch when app comes to foreground
  });

  // Metadata (title, counts, permissions) comes from the first page.
  const dishList = query.data?.pages[0];

  const recipes = useMemo(
    () => query.data?.pages.flatMap((page) => page.recipes) ?? [],
    [query.data]
  );

  const trimmedSearch = searchQuery.trim();
  const {
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  } = query;

  // Recipe search matches locally (titles, tags, ingredients), so load the
  // remaining pages while a query is active to avoid missing unloaded recipes.
  useEffect(() => {
    if (
      !trimmedSearch ||
      !hasNextPage ||
      isFetchingNextPage ||
      isFetchNextPageError
    ) {
      return;
    }
    void fetchNextPage();
  }, [
    trimmedSearch,
    recipes.length,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    fetchNextPage,
  ]);

  const filteredRecipes = useMemo(() => {
    if (!trimmedSearch) return recipes;
    return searchRecipes(recipes, trimmedSearch);
  }, [recipes, trimmedSearch]);

  return {
    dishList,
    filteredRecipes,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isRefetching: query.isRefetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
  };
}
