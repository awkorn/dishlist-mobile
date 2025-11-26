import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X, Camera, User as UserIcon } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";
import { UserProfile, updateUserProfile } from "../../services/api";
import { uploadImage } from "../../services/image";
import Button from "../ui/Button";

interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  currentUser: UserProfile;
}

export default function EditProfileSheet({
  visible,
  onClose,
  onSave,
  currentUser,
}: EditProfileSheetProps) {
  const [firstName, setFirstName] = useState(currentUser.firstName || "");
  const [lastName, setLastName] = useState(currentUser.lastName || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [bio, setBio] = useState(currentUser.bio || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(
    currentUser.avatarUrl || null
  );
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setFirstName(currentUser.firstName || "");
      setLastName(currentUser.lastName || "");
      setUsername(currentUser.username || "");
      setBio(currentUser.bio || "");
      setAvatarUri(currentUser.avatarUrl || null);
      setAvatarChanged(false);
    }
  }, [visible, currentUser]);

  const updateMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      onSave();
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to update profile"
      );
    },
  });

  const handleChoosePhoto = () => {
    Alert.alert("Change Profile Picture", "Choose an option", [
      { text: "Cancel", style: "cancel" },
      { text: "Take Photo", onPress: openCamera },
      { text: "Choose from Library", onPress: openImagePicker },
      ...(avatarUri
        ? [
            {
              text: "Remove Photo",
              style: "destructive" as const,
              onPress: () => {
                setAvatarUri(null);
                setAvatarChanged(true);
              },
            },
          ]
        : []),
    ]);
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera permission is needed.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      setAvatarChanged(true);
    }
  };

  const openImagePicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Photo library permission is needed.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      setAvatarChanged(true);
    }
  };

  const handleSave = async () => {
    try {
      let finalAvatarUrl = avatarUri;

      // Upload new avatar if changed
      if (avatarChanged && avatarUri && !avatarUri.startsWith("http")) {
        setImageUploading(true);
        finalAvatarUrl = await uploadImage(avatarUri, "avatars");
        setImageUploading(false);
      }

      await updateMutation.mutateAsync({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: finalAvatarUrl || undefined,
      });
    } catch (error) {
      setImageUploading(false);
      console.error("Update profile error:", error);
    }
  };

  const isLoading = updateMutation.isPending || imageUploading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
              onPress={handleChoosePhoto}
              disabled={isLoading}
              style={styles.avatarTouchable}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
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
              value={firstName}
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
              value={lastName}
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
              value={username}
              onChangeText={(text) =>
                setUsername(text.toLowerCase().replace(/\s/g, ""))
              }
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
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={160}
              textAlignVertical="top"
              editable={!isLoading}
            />
            <Text style={styles.characterCount}>{bio.length}/160</Text>
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
            title={isLoading ? "Saving..." : "Save Changes"}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarTouchable: {
    position: "relative",
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
    justifyContent: "center",
    alignItems: "center",
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
  footer: {
    flexDirection: "row",
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
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    ...typography.body,
    fontWeight: "600",
    color: theme.colors.neutral[700],
  },
  saveButton: {
    flex: 1,
  },
});
