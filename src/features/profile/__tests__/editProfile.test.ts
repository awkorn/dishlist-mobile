import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useEditProfile } from '../hooks/useEditProfile';
import { profileService } from '../services/profileService';
import { uploadImage } from '@services/image';

jest.mock('../services/profileService', () => ({
  profileService: {
    updateProfile: jest.fn(),
  },
}));

jest.mock('@services/image', () => ({
  uploadImage: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useEditProfile', () => {
  const mockCurrentUser: import('../types').UserProfile = {
    uid: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'John',
    lastName: 'Doe',
    bio: 'Hello world',
    avatarUrl: 'https://example.com/avatar.jpg',
    followerCount: 10,
    followingCount: 5,
    isOwnProfile: true,
    followStatus: 'NONE',
  };

  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes form state from currentUser', () => {
    const { result } = renderHook(
      () => useEditProfile({ currentUser: mockCurrentUser, onSuccess: mockOnSuccess }),
      { wrapper: createWrapper() }
    );

    expect(result.current.formState.firstName).toBe('John');
    expect(result.current.formState.lastName).toBe('Doe');
    expect(result.current.formState.username).toBe('testuser');
    expect(result.current.formState.bio).toBe('Hello world');
    expect(result.current.formState.avatarUri).toBe('https://example.com/avatar.jpg');
    expect(result.current.formState.avatarChanged).toBe(false);
  });

  it('updates firstName when setFirstName is called', () => {
    const { result } = renderHook(
      () => useEditProfile({ currentUser: mockCurrentUser, onSuccess: mockOnSuccess }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setFirstName('Jane');
    });

    expect(result.current.formState.firstName).toBe('Jane');
  });

  it('formats username to lowercase without spaces', () => {
    const { result } = renderHook(
      () => useEditProfile({ currentUser: mockCurrentUser, onSuccess: mockOnSuccess }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setUsername('New User Name');
    });

    expect(result.current.formState.username).toBe('newusername');
  });

  it('detects hasChanges when form is modified', () => {
    const { result } = renderHook(
      () => useEditProfile({ currentUser: mockCurrentUser, onSuccess: mockOnSuccess }),
      { wrapper: createWrapper() }
    );

    expect(result.current.hasChanges).toBe(false);

    act(() => {
      result.current.setBio('New bio');
    });

    expect(result.current.hasChanges).toBe(true);
  });

  it('resets form when resetForm is called', () => {
    const { result } = renderHook(
      () => useEditProfile({ currentUser: mockCurrentUser, onSuccess: mockOnSuccess }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setFirstName('Changed');
      result.current.setBio('Changed bio');
    });

    expect(result.current.formState.firstName).toBe('Changed');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formState.firstName).toBe('John');
    expect(result.current.formState.bio).toBe('Hello world');
  });

  it('calls profileService.updateProfile on save', async () => {
    (profileService.updateProfile as jest.Mock).mockResolvedValueOnce({ user: mockCurrentUser });

    const { result } = renderHook(
      () => useEditProfile({ currentUser: mockCurrentUser, onSuccess: mockOnSuccess }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setBio('Updated bio');
    });

    await act(async () => {
      await result.current.handleSave();
    });

    expect(profileService.updateProfile).toHaveBeenCalledWith(
      {
        firstName: 'John',
        lastName: undefined, // Not changed
        username: 'testuser',
        bio: 'Updated bio',
        avatarUrl: undefined, // Not changed
      },
      expect.anything() // TanStack Query passes additional params
    );
  });

  it('uploads image and saves with Supabase URL when avatar is a local file', async () => {
    const localImageUri = 'file:///local/image.jpg';
    const uploadedUrl = 'https://example.supabase.co/storage/v1/object/public/avatars/new-avatar.jpg';

    (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValueOnce({ granted: true });
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: localImageUri }],
    });
    (uploadImage as jest.Mock).mockResolvedValueOnce(uploadedUrl);
    (profileService.updateProfile as jest.Mock).mockResolvedValueOnce({ user: mockCurrentUser });

    const { result } = renderHook(
      () => useEditProfile({ currentUser: mockCurrentUser, onSuccess: mockOnSuccess }),
      { wrapper: createWrapper() }
    );

    // Open image options and select "Choose from Library"
    act(() => {
      result.current.showImageOptions();
    });

    const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const chooseFromLibrary = alertButtons.find((b: any) => b.text === 'Choose from Library');

    await act(async () => {
      await chooseFromLibrary.onPress();
    });

    expect(result.current.formState.avatarUri).toBe(localImageUri);
    expect(result.current.formState.avatarChanged).toBe(true);

    await act(async () => {
      await result.current.handleSave();
    });

    expect(uploadImage).toHaveBeenCalledWith(localImageUri, 'avatars');
    expect(profileService.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: uploadedUrl })
    );
  });

  it('calls onSuccess after successful save', async () => {
    (profileService.updateProfile as jest.Mock).mockResolvedValueOnce({ user: mockCurrentUser });

    const { result } = renderHook(
      () => useEditProfile({ currentUser: mockCurrentUser, onSuccess: mockOnSuccess }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('shows alert on save error', async () => {
    const error = { response: { data: { error: 'Username taken' } } };
    (profileService.updateProfile as jest.Mock).mockRejectedValueOnce(error);

    const { result } = renderHook(
      () => useEditProfile({ currentUser: mockCurrentUser, onSuccess: mockOnSuccess }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.handleSave();
      } catch (e) {
        // mutateAsync throws errors, which is expected
      }
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Username taken');
    });
  });

  it('shows image options alert when showImageOptions is called', () => {
    const { result } = renderHook(
      () => useEditProfile({ currentUser: mockCurrentUser, onSuccess: mockOnSuccess }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.showImageOptions();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Change Profile Picture',
      'Choose an option',
      expect.any(Array)
    );
  });
});
