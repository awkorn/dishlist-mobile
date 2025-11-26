import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadImage } from '@services/image';
import { profileService } from '../services/profileService';
import { PROFILE_QUERY_KEY } from './useProfile';
import type { UserProfile, EditProfileState } from '../types';

interface UseEditProfileOptions {
  currentUser: UserProfile;
  onSuccess?: () => void;
}

const initialState = (user: UserProfile): EditProfileState => ({
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  username: user.username || '',
  bio: user.bio || '',
  avatarUri: user.avatarUrl || null,
  avatarChanged: false,
  isUploading: false,
});

export function useEditProfile({ currentUser, onSuccess }: UseEditProfileOptions) {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<EditProfileState>(initialState(currentUser));

  // Reset form when user changes
  useEffect(() => {
    setFormState(initialState(currentUser));
  }, [currentUser]);

  const updateMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY] });
      onSuccess?.();
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to update profile'
      );
    },
  });

  const setField = useCallback(<K extends keyof EditProfileState>(
    field: K,
    value: EditProfileState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  const setUsername = useCallback((text: string) => {
    // Auto-format username: lowercase, no spaces
    setFormState(prev => ({
      ...prev,
      username: text.toLowerCase().replace(/\s/g, ''),
    }));
  }, []);

  const requestCameraPermission = async (): Promise<boolean> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return false;
    }
    return true;
  };

  const requestMediaPermission = async (): Promise<boolean> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Photo library permission is needed.');
      return false;
    }
    return true;
  };

  const handleImageResult = useCallback((result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets[0]) {
      setFormState(prev => ({
        ...prev,
        avatarUri: result.assets[0].uri,
        avatarChanged: true,
      }));
    }
  }, []);

  const openCamera = useCallback(async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    handleImageResult(result);
  }, [handleImageResult]);

  const openImagePicker = useCallback(async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    handleImageResult(result);
  }, [handleImageResult]);

  const removePhoto = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      avatarUri: null,
      avatarChanged: true,
    }));
  }, []);

  const showImageOptions = useCallback(() => {
    const options = [
      { text: 'Cancel', style: 'cancel' as const },
      { text: 'Take Photo', onPress: openCamera },
      { text: 'Choose from Library', onPress: openImagePicker },
    ];

    if (formState.avatarUri) {
      options.push({
        text: 'Remove Photo',
        style: 'destructive' as const,
        onPress: removePhoto,
      } as any);
    }

    Alert.alert('Change Profile Picture', 'Choose an option', options);
  }, [formState.avatarUri, openCamera, openImagePicker, removePhoto]);

  const resetForm = useCallback(() => {
    setFormState(initialState(currentUser));
  }, [currentUser]);

  const handleSave = useCallback(async () => {
    let finalAvatarUrl = formState.avatarUri;

    // Upload new avatar if changed
    if (formState.avatarChanged && formState.avatarUri && !formState.avatarUri.startsWith('http')) {
      try {
        setFormState(prev => ({ ...prev, isUploading: true }));
        finalAvatarUrl = await uploadImage(formState.avatarUri, 'avatars');
      } catch (error) {
        Alert.alert('Error', 'Failed to upload profile picture');
        setFormState(prev => ({ ...prev, isUploading: false }));
        return;
      }
    }

    setFormState(prev => ({ ...prev, isUploading: false }));

    await updateMutation.mutateAsync({
      firstName: formState.firstName.trim() || undefined,
      lastName: formState.lastName.trim() || undefined,
      username: formState.username.trim() || undefined,
      bio: formState.bio.trim() || undefined,
      avatarUrl: formState.avatarChanged ? (finalAvatarUrl || undefined) : undefined,
    });
  }, [formState, updateMutation]);

  const isLoading = updateMutation.isPending || formState.isUploading;

  const hasChanges = 
    formState.firstName !== (currentUser.firstName || '') ||
    formState.lastName !== (currentUser.lastName || '') ||
    formState.username !== (currentUser.username || '') ||
    formState.bio !== (currentUser.bio || '') ||
    formState.avatarChanged;

  return {
    // Form state
    formState,
    
    // Field setters
    setFirstName: (value: string) => setField('firstName', value),
    setLastName: (value: string) => setField('lastName', value),
    setUsername,
    setBio: (value: string) => setField('bio', value),
    
    // Image actions
    showImageOptions,
    
    // Form actions
    handleSave,
    resetForm,
    
    // State
    isLoading,
    hasChanges,
  };
}