import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "../services/profileService";
import { searchRecipes, searchDishLists } from "@utils/recipeSearch";
import type { ProfileTab, ProfileDishList, ProfileRecipe } from "../types";

export const PROFILE_QUERY_KEY = "userProfile";

export function useProfile(userId: string) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("DishLists");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [PROFILE_QUERY_KEY, userId],
    queryFn: () => profileService.getUserProfile(userId),
    enabled: !!userId,
  });

  const user = data?.user ?? null;
  const dishlists = data?.dishlists ?? [];
  const recipes = data?.recipes ?? [];

  // Filter dishlists based on search query
  const filteredDishLists = useMemo(() => {
    if (!searchQuery.trim()) return dishlists;
    return searchDishLists(dishlists, searchQuery);
  }, [dishlists, searchQuery]);

  // Filter recipes based on search query
  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    return searchRecipes(recipes, searchQuery);
  }, [recipes, searchQuery]);

  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.username || "User";
  }, [user]);

  const handleTabChange = useCallback((tab: ProfileTab) => {
    setActiveTab(tab);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSearchToggle = useCallback(() => {
    setIsSearchActive((prev) => {
      if (prev) {
        // Closing search - clear the query
        setSearchQuery("");
      }
      return !prev;
    });
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchActive(false);
    setSearchQuery("");
  }, []);

  return {
    // Data
    user,
    dishlists: filteredDishLists,
    recipes: filteredRecipes,
    allDishListsCount: dishlists.length,
    allRecipesCount: recipes.length,
    displayName,
    activeTab,

    // Search state
    searchQuery,
    isSearchActive,

    // Loading state
    isLoading,
    isError,
    error,

    // Actions
    refetch,
    setActiveTab: handleTabChange,
    setSearchQuery: handleSearchChange,
    toggleSearch: handleSearchToggle,
    closeSearch,
  };
}