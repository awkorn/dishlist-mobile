import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { useEditProfile } from "../hooks/useEditProfile";
import type { UserProfile } from "../types";
import Avatar from "@components/ui/Avatar";

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

  const handleCancel = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    handleSave();
  };

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
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleCancel}
              disabled={isLoading}
              style={styles.headerAction}
            >
              <Text style={styles.headerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              style={styles.headerAction}
            >
              <Text
                style={[
                  styles.headerSaveText,
                  isLoading && styles.headerActionDisabled,
                ]}
              >
                {isLoading ? "Saving" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={showImageOptions}
                disabled={isLoading}
                style={styles.avatarTouchable}
              >
                <Avatar
                  avatarUrl={formState.avatarUri}
                  firstName={formState.firstName}
                  lastName={formState.lastName}
                  username={currentUser.username}
                  size={100}
                />
                <View style={styles.cameraIcon}>
                  <Camera size={16} color="white" />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarLabel}>Change Profile Picture</Text>
            </View>

            {/* First Name */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>
                First Name <Text style={styles.required}>*</Text>
              </Text>
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
              <Text style={styles.label}>
                Username <Text style={styles.required}>*</Text>
              </Text>
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
              <Text style={styles.characterCount}>
                {formState.bio.length}/160
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  headerTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[900],
  },
  headerAction: {
    minWidth: 64,
    minHeight: 44,
    justifyContent: "center",
  },
  headerCancelText: {
    ...typography.body,
    color: theme.colors.neutral[700],
  },
  headerSaveText: {
    ...typography.body,
    color: theme.colors.primary[500],
    fontWeight: "600",
    textAlign: "right",
  },
  headerActionDisabled: {
    color: theme.colors.neutral[400],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarTouchable: {
    position: "relative",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "600",
    color: theme.colors.neutral[700],
    marginBottom: 8,
  },
  required: {
    color: theme.colors.error,
  },
  input: {
    ...typography.body,
    backgroundColor: "white",
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
    textAlign: "right",
    marginTop: 4,
  },
});
