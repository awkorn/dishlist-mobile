import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@lib/queryKeys';
import { dishlistService } from '../services';
import { searchRecipes } from '@utils/recipeSearch';
import type { DishListDetail, DishListRecipe } from '../types';

interface UseDishListDetailOptions {
  dishListId: string;
  searchQuery?: string;
}

interface UseDishListDetailResult {
  dishList: DishListDetail | undefined;
  filteredRecipes: DishListRecipe[];
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

export function useDishListDetail({ 
  dishListId, 
  searchQuery = '' 
}: UseDishListDetailOptions): UseDishListDetailResult {
  const query = useQuery<DishListDetail, Error>({
    queryKey: queryKeys.dishLists.detail(dishListId),
    queryFn: () => dishlistService.getDishListDetail(dishListId),
    staleTime: 2 * 60 * 1000,
    enabled: !!dishListId,
  });

  const filteredRecipes = useMemo(() => {
    if (!query.data?.recipes) return [];
    if (!searchQuery.trim()) return query.data.recipes;
    
    // Use the new intelligent search utility
    return searchRecipes(query.data.recipes, searchQuery);
  }, [query.data?.recipes, searchQuery]);

  return {
    dishList: query.data,
    filteredRecipes,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}