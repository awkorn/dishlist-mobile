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
import { useCreateDishList } from "../../hooks/useDishLists";
import { typography } from "../../styles/typography";
import { theme } from "../../styles/theme";
import Button from "../../components/ui/Button";

interface CreateDishListScreenProps {
  navigation: any;
}

export default function CreateDishListScreen({
  navigation,
}: CreateDishListScreenProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [titleError, setTitleError] = useState("");

  const createDishListMutation = useCreateDishList();

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
    if (title.trim() || description.trim()) {
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

  const handleCreate = async () => {
    if (!validateTitle(title)) {
      return;
    }

    try {
      await createDishListMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
      });

      navigation.goBack();
    } catch (error) {
      console.error("Create DishList error:", error);
    }
  };

  const getVisibilityMessage = () => {
    return visibility === "PUBLIC"
      ? "Anyone can view, follow, and copy recipes from this DishList."
      : "Only you and collaborators can view this DishList.";
  };

  const isLoading = createDishListMutation.isPending;
  const canCreate = title.trim().length >= 2 && !titleError && !isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.cancelButton}
            disabled={isLoading}
          >
            <X size={24} color={theme.colors.neutral[600]} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Create new DishList</Text>

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
                    color={visibility === "PUBLIC" ? theme.colors.primary[500] : theme.colors.neutral[600]}
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
                    color={visibility === "PRIVATE" ? theme.colors.primary[500] : theme.colors.neutral[600]}
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
              </TouchableOpacity>
            </View>

            <Text style={styles.visibilityMessage}>
              {getVisibilityMessage()}
            </Text>
          </View>
        </ScrollView>

        {/* Footer Button */}
        <View style={styles.footer}>
          <Button
            title="Create DishList"
            onPress={handleCreate}
            disabled={!canCreate}
            loading={isLoading}
            style={styles.createButton}
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
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.surface,
  },
  cancelButton: {
    padding: theme.spacing.xs,
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
    padding: theme.spacing['3xl'],
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
    height: 80,
    paddingTop: theme.spacing.lg,
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
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  visibilityOptionActive: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  visibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  visibilityTitle: {
    ...typography.body,
    color: theme.colors.neutral[700],
    fontWeight: "600",
  },
  visibilityTitleActive: {
    color: theme.colors.primary[500],
  },
  visibilityMessage: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing.md,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : theme.spacing.lg,
    alignItems: "center",
  },
  createButton: {
    width: "90%",
  },
});