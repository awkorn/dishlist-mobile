import { api } from "@services/api";
import type { ProfileData, UpdateProfileData, UserProfile, FollowListResponse } from '../types';

export const profileService = {
  /**
   * Fetch the currently authenticated user's lightweight profile
   */
  async getCurrentUserProfile(): Promise<{ user: UserProfile }> {
    const response = await api.get<{ user: UserProfile }>("/users/me");
    return response.data;
  },

  /**
   * Fetch a user's profile by ID
   */
  async getUserProfile(
    userId: string,
    options?: {
      includeRecipes?: boolean;
      includeDishlists?: boolean;
      recipesLimit?: number;
      recipesOffset?: number;
    }
  ): Promise<ProfileData> {
    const params = new URLSearchParams();
    if (options?.includeRecipes !== undefined) {
      params.set("includeRecipes", String(options.includeRecipes));
    }
    if (options?.includeDishlists !== undefined) {
      params.set("includeDishlists", String(options.includeDishlists));
    }
    if (options?.recipesLimit !== undefined) {
      params.set("recipesLimit", String(options.recipesLimit));
    }
    if (options?.recipesOffset !== undefined) {
      params.set("recipesOffset", String(options.recipesOffset));
    }

    const query = params.toString();
    const response = await api.get<ProfileData>(
      `/users/${userId}${query ? `?${query}` : ""}`
    );
    return response.data;
  },

  /**
   * Fetch only recipes for a user profile (paginated)
   */
  async getUserRecipes(
    userId: string,
    options?: { limit?: number; offset?: number }
  ) {
    const response = await profileService.getUserProfile(userId, {
      includeRecipes: true,
      includeDishlists: false,
      recipesLimit: options?.limit ?? 24,
      recipesOffset: options?.offset ?? 0,
    });
    return {
      recipes: response.recipes,
      recipesMeta: response.recipesMeta,
    };
  },

  /**
   * Update the current user's profile
   */
  async updateProfile(data: UpdateProfileData): Promise<{ user: UserProfile }> {
    const response = await api.put<{ user: UserProfile }>("/users/me", data);
    return response.data;
  },

  /**
   * Follow a user
   */
  async followUser(userId: string): Promise<void> {
    await api.post(`/users/${userId}/follow`);
  },

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string): Promise<void> {
    await api.delete(`/users/${userId}/follow`);
  },

  /**
   * Get a user's followers list
   */
  async getFollowers(userId: string): Promise<FollowListResponse> {
    const response = await api.get<FollowListResponse>(
      `/users/${userId}/followers`,
    );
    return response.data;
  },

  /**
   * Get a user's following list
   */
  async getFollowing(userId: string): Promise<FollowListResponse> {
    const response = await api.get<FollowListResponse>(
      `/users/${userId}/following`,
    );
    return response.data;
  },
};
