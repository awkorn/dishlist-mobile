import { profileService } from '../services/profileService';
import { api } from '@services/api';

jest.mock('@services/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    const mockProfileData = {
      user: {
        uid: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        bio: 'Hello world',
        avatarUrl: 'https://example.com/avatar.jpg',
        followerCount: 10,
        followingCount: 5,
        isOwnProfile: true,
      },
      dishlists: [
        {
          id: 'dl-1',
          title: 'My Recipes',
          visibility: 'PUBLIC',
          recipeCount: 3,
        },
      ],
      recipes: [
        {
          id: 'r-1',
          title: 'Pasta',
          imageUrl: 'https://example.com/pasta.jpg',
        },
      ],
    };

    it('fetches user profile successfully', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockProfileData });

      const result = await profileService.getUserProfile('user-123');

      expect(api.get).toHaveBeenCalledWith('/users/user-123');
      expect(result).toEqual(mockProfileData);
    });

    it('throws error when API call fails', async () => {
      const error = new Error('Network error');
      (api.get as jest.Mock).mockRejectedValueOnce(error);

      await expect(profileService.getUserProfile('user-123')).rejects.toThrow('Network error');
    });
  });

  describe('updateProfile', () => {
    const mockUpdatedUser = {
      user: {
        uid: 'user-123',
        email: 'test@example.com',
        username: 'newusername',
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'New bio',
        avatarUrl: 'https://example.com/new-avatar.jpg',
        followerCount: 10,
        followingCount: 5,
        isOwnProfile: true,
      },
    };

    it('updates profile successfully', async () => {
      (api.put as jest.Mock).mockResolvedValueOnce({ data: mockUpdatedUser });

      const updateData = {
        username: 'newusername',
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'New bio',
      };

      const result = await profileService.updateProfile(updateData);

      expect(api.put).toHaveBeenCalledWith('/users/me', updateData);
      expect(result).toEqual(mockUpdatedUser);
    });

    it('updates only provided fields', async () => {
      (api.put as jest.Mock).mockResolvedValueOnce({ data: mockUpdatedUser });

      const updateData = { bio: 'Only updating bio' };

      await profileService.updateProfile(updateData);

      expect(api.put).toHaveBeenCalledWith('/users/me', { bio: 'Only updating bio' });
    });

    it('throws error when update fails', async () => {
      const error = { response: { data: { error: 'Username already taken' } } };
      (api.put as jest.Mock).mockRejectedValueOnce(error);

      await expect(profileService.updateProfile({ username: 'taken' })).rejects.toEqual(error);
    });
  });
});