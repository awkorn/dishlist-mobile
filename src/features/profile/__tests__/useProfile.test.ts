import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useProfile } from '../hooks/useProfile';
import { profileService } from '../services/profileService';

jest.mock('../services/profileService', () => ({
  profileService: {
    getUserProfile: jest.fn(),
    getUserRecipes: jest.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useProfile', () => {
  const mockProfileData = {
    user: {
      uid: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'John',
      lastName: 'Doe',
      bio: 'Hello world',
      avatarUrl: null,
      followerCount: 10,
      followingCount: 5,
      isOwnProfile: true,
      blockStatus: 'NONE',
    },
    dishlists: [
      { id: 'dl-1', title: 'My Recipes', recipeCount: 3 },
    ],
    recipes: [
      { id: 'r-1', title: 'Pasta' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (profileService.getUserProfile as jest.Mock).mockResolvedValue(mockProfileData);
    (profileService.getUserRecipes as jest.Mock).mockResolvedValue({
      recipes: [],
      recipesMeta: { hasMore: false, limit: 24, offset: 0 },
    });
  });

  it('loads profile data on mount', async () => {
    const { result } = renderHook(() => useProfile('user-123'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockProfileData.user);
    expect(result.current.dishlists).toEqual(mockProfileData.dishlists);
    expect(result.current.recipes).toEqual([]);
  });

  it('computes displayName correctly with first and last name', async () => {
    const { result } = renderHook(() => useProfile('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.displayName).toBe('John Doe');
  });

  it('computes displayName with only firstName', async () => {
    (profileService.getUserProfile as jest.Mock).mockResolvedValue({
      ...mockProfileData,
      user: { ...mockProfileData.user, lastName: null },
    });

    const { result } = renderHook(() => useProfile('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.displayName).toBe('John');
  });

  it('computes displayName with username fallback', async () => {
    (profileService.getUserProfile as jest.Mock).mockResolvedValue({
      ...mockProfileData,
      user: { ...mockProfileData.user, firstName: null, lastName: null },
    });

    const { result } = renderHook(() => useProfile('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.displayName).toBe('testuser');
  });

  it('defaults activeTab to DishLists', async () => {
    const { result } = renderHook(() => useProfile('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.activeTab).toBe('DishLists');
  });

  it('changes tab when setActiveTab is called', async () => {
    const { result } = renderHook(() => useProfile('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setActiveTab('Recipes');
    });

    expect(result.current.activeTab).toBe('Recipes');
  });

  it('handles error state', async () => {
    (profileService.getUserProfile as jest.Mock).mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useProfile('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.user).toBeNull();
  });

  it('exposes recipe fetch errors separately from an empty recipe list', async () => {
    const recipeError = new Error('Network error');
    (profileService.getUserRecipes as jest.Mock).mockRejectedValue(recipeError);

    const { result } = renderHook(() => useProfile('user-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setActiveTab('Recipes');
    });

    await waitFor(() => {
      expect(result.current.isRecipesError).toBe(true);
    });

    expect(result.current.recipesError).toBe(recipeError);
    expect(result.current.recipes).toEqual([]);
  });

  it('loads all remaining recipe pages before finalizing search results', async () => {
    (profileService.getUserRecipes as jest.Mock).mockImplementation(
      (_userId: string, { offset }: { offset: number }) => {
        if (offset === 0) {
          return Promise.resolve({
            recipes: [{ id: 'r-new', title: 'Weeknight Pasta' }],
            recipesMeta: { hasMore: true, limit: 24, offset: 0 },
          });
        }

        if (offset === 24) {
          return Promise.resolve({
            recipes: [{ id: 'r-middle', title: 'Quick Lunch' }],
            recipesMeta: { hasMore: true, limit: 24, offset: 24 },
          });
        }

        return Promise.resolve({
          recipes: [
            {
              id: 'r-old',
              title: 'Sunday Dinner',
              tags: ['holiday'],
            },
          ],
          recipesMeta: { hasMore: false, limit: 24, offset: 48 },
        });
      }
    );

    const { result } = renderHook(() => useProfile('user-123'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setActiveTab('Recipes');
    });

    await waitFor(() => {
      expect(result.current.recipes).toEqual([
        { id: 'r-new', title: 'Weeknight Pasta' },
      ]);
    });

    act(() => {
      result.current.setSearchQuery('holiday');
    });

    await waitFor(() => {
      expect(profileService.getUserRecipes).toHaveBeenCalledWith('user-123', {
        limit: 24,
        offset: 48,
      });
      expect(result.current.recipes).toEqual([
        {
          id: 'r-old',
          title: 'Sunday Dinner',
          tags: ['holiday'],
        },
      ]);
      expect(result.current.hasMoreRecipes).toBe(false);
    });
  });

  it('does not fetch when userId is empty', async () => {
    const { result } = renderHook(() => useProfile(''), {
      wrapper: createWrapper(),
    });

    // Should not call the service
    expect(profileService.getUserProfile).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
