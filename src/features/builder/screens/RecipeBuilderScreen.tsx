import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { RefreshCcw, SquarePen } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { useRecipeBuilder } from "../hooks";
import { useCreateRecipe } from "@features/recipe/hooks";
import {
  BuilderChatInput,
  GeneratedRecipeCard,
  GeneratedRecipeDetailSheet,
  PreferencesButton,
  PreferencesModal,
  SelectDishListModal,
  CARD_GAP,
} from "../components";
import type { GeneratedRecipe, BuilderMessage } from "../types";

export default function RecipeBuilderScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const {
    messages,
    isGenerating,
    error,
    sendPrompt,
    regenerateRecipes,
    clearChat,
    preferences,
    setPreferences,
  } = useRecipeBuilder();

  const [selectedRecipe, setSelectedRecipe] = useState<GeneratedRecipe | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);
  const [showDishListPicker, setShowDishListPicker] = useState(false);
  const [recipeToSave, setRecipeToSave] = useState<GeneratedRecipe | null>(
    null
  );
  const [showPreferences, setShowPreferences] = useState(false);

  const createRecipeMutation = useCreateRecipe();

  const handleSend = useCallback(
    async (text: string) => {
      await sendPrompt(text);
      // Scroll to bottom after response
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 300);
    },
    [sendPrompt]
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, []);

  const handleRegenerate = useCallback(async () => {
    await regenerateRecipes();
    scrollToBottom();
  }, [regenerateRecipes, scrollToBottom]);

  const handleNewChat = useCallback(() => {
    clearChat();
    setSelectedRecipe(null);
    setShowDetail(false);
    setShowDishListPicker(false);
    setRecipeToSave(null);
  }, [clearChat]);

  const handleRecipePress = useCallback((recipe: GeneratedRecipe) => {
    setSelectedRecipe(recipe);
    setShowDetail(true);
  }, []);

  const handleSaveRecipe = useCallback((recipe: GeneratedRecipe) => {
    setShowDetail(false);
    setRecipeToSave(recipe);
    setShowDishListPicker(true);
  }, []);

  const handleDishListSelected = useCallback(
    (dishListId: string) => {
      if (!recipeToSave) return;

      createRecipeMutation.mutate(
        {
          title: recipeToSave.title,
          ingredients: recipeToSave.ingredients,
          instructions: recipeToSave.instructions,
          prepTime: recipeToSave.prepTime ?? undefined,
          cookTime: recipeToSave.cookTime ?? undefined,
          servings: recipeToSave.servings ?? undefined,
          tags: recipeToSave.tags,
          dishListId,
        },
        {
          onSuccess: () => {
            setShowDishListPicker(false);
            setRecipeToSave(null);
            Alert.alert("Saved!", "Recipe has been added to your DishList.");
          },
        }
      );
    },
    [recipeToSave, createRecipeMutation]
  );

  const handlePreferencesPress = () => {
    setShowPreferences(true);
  };

  const hasMessages = messages.length > 0;
  const latestRecipeMessageId = getLatestRecipeMessageId(messages);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Recipe Builder</Text>
          <PreferencesButton
            onPress={handlePreferencesPress}
            activeCount={preferences.length}
          />
        </View>

        {/* Chat Area */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={[
            styles.chatContent,
            !hasMessages && styles.chatContentEmpty,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!hasMessages && !isGenerating ? (
            // Empty state
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Describe what you want to cook
              </Text>
            </View>
          ) : (
            // Messages
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onRecipePress={handleRecipePress}
                onRegenerate={handleRegenerate}
                onNewChat={handleNewChat}
                showActions={message.id === latestRecipeMessageId}
                actionsDisabled={isGenerating}
              />
            ))
          )}

          {/* Loading state */}
          {isGenerating && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={theme.colors.primary[500]}
              />
              <Text style={styles.loadingText}>Loading recipes...</Text>
            </View>
          )}

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <BuilderChatInput onSend={handleSend} disabled={isGenerating} />

        {/* Preferences */}
        <PreferencesModal
          visible={showPreferences}
          selectedPreferences={preferences}
          onClose={() => setShowPreferences(false)}
          onSave={setPreferences}
        />

        {/* Recipe Detail Sheet */}
        <GeneratedRecipeDetailSheet
          recipe={selectedRecipe}
          visible={showDetail}
          onClose={() => setShowDetail(false)}
          onSave={handleSaveRecipe}
        />

        {/* DishList Picker for saving */}
        <SelectDishListModal
          visible={showDishListPicker}
          onClose={() => {
            setShowDishListPicker(false);
            setRecipeToSave(null);
          }}
          onSelect={handleDishListSelected}
          saving={createRecipeMutation.isPending}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Message Bubble Component ───────────────────────────────────────
interface MessageBubbleProps {
  message: BuilderMessage;
  onRecipePress: (recipe: GeneratedRecipe) => void;
  onRegenerate: () => void;
  onNewChat: () => void;
  showActions: boolean;
  actionsDisabled: boolean;
}

function MessageBubble({
  message,
  onRecipePress,
  onRegenerate,
  onNewChat,
  showActions,
  actionsDisabled,
}: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <View style={styles.userBubble}>
        <Text style={styles.userBubbleText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View style={styles.assistantBubble}>
      {/* Recipe cards grid - 2 per row */}
      {message.recipes && message.recipes.length > 0 && (
        <View style={styles.recipesGrid}>
          {message.recipes.map((recipe, index) => (
            <GeneratedRecipeCard
              key={`${message.id}-recipe-${index}`}
              recipe={recipe}
              onPress={() => onRecipePress(recipe)}
            />
          ))}
        </View>
      )}
      {showActions && (
        <View style={styles.recipeActions}>
          <TouchableOpacity
            style={[
              styles.recipeActionButton,
              actionsDisabled && styles.recipeActionButtonDisabled,
            ]}
            onPress={onRegenerate}
            disabled={actionsDisabled}
            accessibilityRole="button"
            accessibilityLabel="Regenerate recipes"
            hitSlop={8}
            activeOpacity={0.65}
          >
            <RefreshCcw
              size={22}
              color={
                actionsDisabled
                  ? theme.colors.neutral[400]
                  : theme.colors.neutral[900]
              }
              strokeWidth={2}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.recipeActionButton,
              actionsDisabled && styles.recipeActionButtonDisabled,
            ]}
            onPress={onNewChat}
            disabled={actionsDisabled}
            accessibilityRole="button"
            accessibilityLabel="Start a new chat"
            hitSlop={8}
            activeOpacity={0.65}
          >
            <SquarePen
              size={22}
              color={
                actionsDisabled
                  ? theme.colors.neutral[400]
                  : theme.colors.neutral[900]
              }
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function getLatestRecipeMessageId(messages: BuilderMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (
      message.role === "assistant" &&
      message.recipes &&
      message.recipes.length > 0
    ) {
      return message.id;
    }
  }

  return null;
}

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  title: {
    ...typography.heading4,
    color: theme.colors.textPrimary,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  chatContentEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    fontSize: 16,
  },
  // User bubble
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    backgroundColor: theme.colors.primary[500],
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: theme.spacing.md,
  },
  userBubbleText: {
    ...typography.body,
    color: "#FFFFFF",
  },
  // Assistant bubble
  assistantBubble: {
    alignSelf: "flex-start",
    width: "100%",
    marginBottom: theme.spacing.lg,
  },
  assistantText: {
    ...typography.body,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.md,
  },
  // Recipe grid
  recipesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  recipeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  recipeActionButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeActionButtonDisabled: {
    opacity: 0.5,
  },
  // Loading
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: theme.colors.neutral[600],
  },
  // Error
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: theme.colors.error,
  },
});
