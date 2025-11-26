import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Globe, Lock } from "lucide-react-native";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
import Button from "@components/ui/Button";
import { useCreateDishList, useUpdateDishList } from "../hooks";

interface CreateDishListScreenProps {
  route: {
    params?: {
      dishListId?: string;
      dishList?: {
        title: string;
        description?: string;
        visibility: "PUBLIC" | "PRIVATE";
      };
    };
  };
  navigation: any;
}

export default function CreateDishListScreen({
  route,
  navigation,
}: CreateDishListScreenProps) {
  const { dishListId, dishList } = route.params || {};
  const isEditMode = !!dishListId;

  const [title, setTitle] = useState(dishList?.title || "");
  const [description, setDescription] = useState(dishList?.description || "");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">(
    dishList?.visibility || "PUBLIC"
  );
  const [titleError, setTitleError] = useState("");

  const createMutation = useCreateDishList();
  const updateMutation = useUpdateDishList();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const validateTitle = (value: string) => {
    if (!value.trim()) {
      setTitleError("Title is required");
      return false;
    }
    if (value.trim().length < 2) {
      setTitleError("Title must be at least 2 characters");
      return false;
    }
    if (value.trim().length > 50) {
      setTitleError("Title must be less than 50 characters");
      return false;
    }
    setTitleError("");
    return true;
  };

  const handleTitleChange = (text: string) => {
    setTitle(text);
    if (titleError) {
      validateTitle(text);
    }
  };

  const handleCancel = () => {
    const hasChanges = isEditMode
      ? title.trim() !== dishList?.title ||
        description.trim() !== (dishList?.description || "") ||
        visibility !== dishList?.visibility
      : title.trim() || description.trim();

    if (hasChanges) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSave = () => {
    if (!validateTitle(title)) return;

    if (isEditMode && dishListId) {
      updateMutation.mutate(
        {
          dishListId,
          title: title.trim(),
          description: description.trim() || undefined,
          visibility,
        },
        {
          onSuccess: () => navigation.goBack(),
        }
      );
    } else {
      createMutation.mutate(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          visibility,
        },
        {
          onSuccess: () => navigation.goBack(),
        }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} disabled={isLoading}>
            <X size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {isEditMode ? "Edit DishList" : "Create new DishList"}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={[styles.input, titleError ? styles.inputError : null]}
              placeholder="Enter DishList title"
              placeholderTextColor={theme.colors.neutral[400]}
              value={title}
              onChangeText={handleTitleChange}
              onBlur={() => validateTitle(title)}
              maxLength={50}
              returnKeyType="next"
              autoFocus
              editable={!isLoading}
            />
            {titleError ? (
              <Text style={styles.errorText}>{titleError}</Text>
            ) : null}
            <Text style={styles.characterCount}>{title.length}/50</Text>
          </View>

          {/* Description Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a description (optional)"
              placeholderTextColor={theme.colors.neutral[400]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
              returnKeyType="done"
              textAlignVertical="top"
              editable={!isLoading}
            />
            <Text style={styles.characterCount}>{description.length}/200</Text>
          </View>

          {/* Visibility Selector */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Visibility</Text>

            <View style={styles.visibilityOptions}>
              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === "PUBLIC" && styles.visibilityOptionActive,
                ]}
                onPress={() => setVisibility("PUBLIC")}
                disabled={isLoading}
              >
                <View style={styles.visibilityHeader}>
                  <Globe
                    size={20}
                    color={
                      visibility === "PUBLIC"
                        ? theme.colors.primary[500]
                        : theme.colors.neutral[500]
                    }
                  />
                  <Text
                    style={[
                      styles.visibilityTitle,
                      visibility === "PUBLIC" && styles.visibilityTitleActive,
                    ]}
                  >
                    Public
                  </Text>
                </View>
                <Text style={styles.visibilityDescription}>
                  Anyone can view and follow this DishList
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.visibilityOption,
                  visibility === "PRIVATE" && styles.visibilityOptionActive,
                ]}
                onPress={() => setVisibility("PRIVATE")}
                disabled={isLoading}
              >
                <View style={styles.visibilityHeader}>
                  <Lock
                    size={20}
                    color={
                      visibility === "PRIVATE"
                        ? theme.colors.primary[500]
                        : theme.colors.neutral[500]
                    }
                  />
                  <Text
                    style={[
                      styles.visibilityTitle,
                      visibility === "PRIVATE" && styles.visibilityTitleActive,
                    ]}
                  >
                    Private
                  </Text>
                </View>
                <Text style={styles.visibilityDescription}>
                  Only you and collaborators can view
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={handleCancel}
            disabled={isLoading}
            style={styles.cancelButton}
          />
          <Button
            title={isEditMode ? "Save Changes" : "Create DishList"}
            onPress={handleSave}
            loading={isLoading}
            disabled={!title.trim() || isLoading}
            style={styles.saveButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: theme.spacing["3xl"],
    marginTop: theme.spacing.md,
  },
  inputSection: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...typography.subtitle,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.neutral[800],
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  textArea: {
    minHeight: 100,
    paddingTop: theme.spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  characterCount: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    textAlign: "right",
    marginTop: theme.spacing.xs,
  },
  visibilityOptions: {
    gap: theme.spacing.md,
  },
  visibilityOption: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  visibilityOptionActive: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  visibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  visibilityTitle: {
    ...typography.body,
    fontWeight: "600",
    color: theme.colors.neutral[700],
  },
  visibilityTitleActive: {
    color: theme.colors.primary[500],
  },
  visibilityDescription: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginLeft: 28,
  },
  footer: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
