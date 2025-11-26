import { api } from '@services/api';
import type { ProfileData, UpdateProfileData, UserProfile } from '../types';

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
    const response = await api.put<{ user: UserProfile }>('/users/me', data);
    return response.data;
  },
};