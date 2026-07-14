import React, { useState } from "react";
import {
  View,
  Text,
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
import { TextField } from "@components/ui";
import { useCreateDishList, useUpdateDishList } from "../hooks";

interface CreateDishListScreenProps {
  route: {
    params?: {
      dishListId?: string;
      dishList?: {
        title: string;
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
        visibility !== dishList?.visibility
      : title.trim();

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
          <TouchableOpacity
            onPress={handleCancel}
            disabled={isLoading}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close DishList modal"
          >
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
            <TextField
              label="Title"
              required
              error={titleError || undefined}
              placeholder="Enter DishList title"
              value={title}
              onChangeText={handleTitleChange}
              onBlur={() => validateTitle(title)}
              maxLength={50}
              returnKeyType="next"
              autoFocus
              editable={!isLoading}
              showCharacterCount
            />
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
    backgroundColor: theme.colors.surface,
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
    backgroundColor: theme.colors.surface,
  },
  closeButton: {
    width: 44,
    height: 44,
    marginLeft: -theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.editorialNavigationTitle,
    color: theme.colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: theme.spacing["3xl"],
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  inputSection: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...typography.subtitle,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.sm,
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
    backgroundColor: theme.colors.surface,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
