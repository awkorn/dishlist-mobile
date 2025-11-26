import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import type { ProfileTab } from '../types';

export const PROFILE_QUERY_KEY = 'userProfile';

export function useProfile(userId: string) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('DishLists');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [PROFILE_QUERY_KEY, userId],
    queryFn: () => profileService.getUserProfile(userId),
    enabled: !!userId,
  });

  const user = data?.user ?? null;
  const dishlists = data?.dishlists ?? [];
  const recipes = data?.recipes ?? [];

  const displayName = useMemo(() => {
    if (!user) return '';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.username || 'User';
  }, [user]);

  const handleTabChange = useCallback((tab: ProfileTab) => {
    setActiveTab(tab);
  }, []);

  return {
    // Data
    user,
    dishlists,
    recipes,
    displayName,
    activeTab,
    
    // State
    isLoading,
    isError,
    error,
    
    // Actions
    refetch,
    setActiveTab: handleTabChange,
  };
}