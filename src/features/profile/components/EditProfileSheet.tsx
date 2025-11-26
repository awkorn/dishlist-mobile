import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Camera, User as UserIcon } from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import Button from '@components/ui/Button';
import { useEditProfile } from '../hooks/useEditProfile';
import type { UserProfile } from '../types';

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  currentUser: UserProfile;
}

export function EditProfileSheet({
  visible,
  onClose,
  onSave,
  currentUser,
}: EditProfileSheetProps) {
  const {
    formState,
    setFirstName,
    setLastName,
    setUsername,
    setBio,
    showImageOptions,
    handleSave,
    resetForm,
    isLoading,
  } = useEditProfile({
    currentUser,
    onSuccess: onSave,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={isLoading}>
            <X size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={showImageOptions}
              disabled={isLoading}
              style={styles.avatarTouchable}
            >
              {formState.avatarUri ? (
                <Image source={{ uri: formState.avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <UserIcon size={40} color={theme.colors.neutral[400]} />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Camera size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Change Profile Picture</Text>
          </View>

          {/* First Name */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter first name"
              placeholderTextColor={theme.colors.neutral[400]}
              value={formState.firstName}
              onChangeText={setFirstName}
              maxLength={50}
              editable={!isLoading}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter last name"
              placeholderTextColor={theme.colors.neutral[400]}
              value={formState.lastName}
              onChangeText={setLastName}
              maxLength={50}
              editable={!isLoading}
            />
          </View>

          {/* Username */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter username"
              placeholderTextColor={theme.colors.neutral[400]}
              value={formState.username}
              onChangeText={setUsername}
              maxLength={30}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          {/* Bio */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Tell us about yourself"
              placeholderTextColor={theme.colors.neutral[400]}
              value={formState.bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={160}
              textAlignVertical="top"
              editable={!isLoading}
            />
            <Text style={styles.characterCount}>{formState.bio.length}/160</Text>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Button
            title={isLoading ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={isLoading}
            style={styles.saveButton}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  headerTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[900],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.neutral[200],
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  avatarLabel: {
    ...typography.body,
    color: theme.colors.neutral[600],
    marginTop: 8,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: theme.colors.neutral[700],
    marginBottom: 8,
  },
  input: {
    ...typography.body,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: theme.colors.neutral[900],
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  characterCount: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: theme.colors.neutral[700],
  },
  saveButton: {
    flex: 1,
  },
});