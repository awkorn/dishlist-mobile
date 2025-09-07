import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { X, Globe, Lock } from "lucide-react-native";
import { useCreateDishList } from "../../hooks/useDishLists";
import { typography } from "../../styles/typography";

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
      // Error handling is done in the mutation hook
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
            <X size={24} color="#666" />
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
                    color={visibility === "PUBLIC" ? "#2563eb" : "#666"}
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
                    color={visibility === "PRIVATE" ? "#2563eb" : "#666"}
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
          <TouchableOpacity
            style={[
              styles.createButton,
              !canCreate && styles.createButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!canCreate}
          >
            <Text
              style={[
                styles.createButtonText,
                !canCreate && styles.createButtonTextDisabled,
              ]}
            >
              {isLoading ? "Creating..." : "Create DishList"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F2EE",
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
    borderBottomColor: "#E5E5E5",
    backgroundColor: "white",
  },
  cancelButton: {
    padding: 4,
  },
  headerTitle: {
    ...typography.heading3,
    color: "#00295B",
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 30,
    marginTop: 10,
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    ...typography.subtitle,
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "white",
    color: "#333",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  textArea: {
    height: 80,
    paddingTop: 16,
  },
  errorText: {
    ...typography.caption,
    color: "#EF4444",
    marginTop: 4,
  },
  characterCount: {
    ...typography.caption,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  visibilityOptions: {
    gap: 12,
  },
  visibilityOption: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "white",
  },
  visibilityOptionActive: {
    borderColor: "#2563eb",
    backgroundColor: "#F0F7FF",
  },
  visibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  visibilityTitle: {
    ...typography.body,
    color: "#333",
    fontWeight: "600",
  },
  visibilityTitleActive: {
    color: "#2563eb",
  },
  visibilityMessage: {
    ...typography.caption,
    color: "#666",
    marginTop: 12,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    alignItems: "center", 
  },
  createButton: {
    width: "90%", 
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#E5E5E5",
  },
  createButtonText: {
    ...typography.button,
    color: "white",
  },
  createButtonTextDisabled: {
    color: "#666",
  },
});
