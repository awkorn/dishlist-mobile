import { api } from "@services/api";
import type { ProfileData, UpdateProfileData, UserProfile, FollowListResponse } from '../types';

export const profileService = {
  /**
   * Fetch a user's profile by ID
   */
  async getUserProfile(userId: string): Promise<ProfileData> {
    const response = await api.get<ProfileData>(`/users/${userId}`);
    return response.data;
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
