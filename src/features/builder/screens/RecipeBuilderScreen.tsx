import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { RefreshCcw, SquarePen } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { useRecipeBuilder } from "../hooks";
import {
  useAddRecipeToDishList,
  useCreateRecipe,
} from "@features/recipe/hooks";
import { toast } from "@components/ui/toast";
import {
  BuilderChatInput,
  GeneratedRecipeCard,
  GeneratedRecipeDetailSheet,
  PreferencesButton,
  PreferencesModal,
  SelectDishListModal,
  CARD_GAP,
} from "../components";
import { GeneratedRecipesSkeleton } from "../components/GeneratedRecipesSkeleton";
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

  const createRecipeMutation = useCreateRecipe({ showSuccessToast: false });
  const addRecipeMutation = useAddRecipeToDishList();
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);
  const createdRecipeIdRef = useRef<string | null>(null);

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
    createdRecipeIdRef.current = null;
    setShowDishListPicker(true);
  }, []);

  const handleDishListsSelected = useCallback(
    async (dishListIds: string[]) => {
      if (!recipeToSave || dishListIds.length === 0 || isSavingRecipe) return;

      setIsSavingRecipe(true);
      try {
        let createdRecipeId = createdRecipeIdRef.current;
        let destinationIds = dishListIds;

        if (!createdRecipeId) {
          const [firstDishListId, ...remainingDishListIds] = dishListIds;
          const createdRecipe = await createRecipeMutation.mutateAsync({
            title: recipeToSave.title,
            ingredients: recipeToSave.ingredients,
            instructions: recipeToSave.instructions,
            prepTime: recipeToSave.prepTime ?? undefined,
            cookTime: recipeToSave.cookTime ?? undefined,
            servings: recipeToSave.servings ?? undefined,
            tags: [],
            dishListId: firstDishListId,
          });
          createdRecipeId = createdRecipe.id;
          createdRecipeIdRef.current = createdRecipe.id;
          destinationIds = remainingDishListIds;
        }

        for (const dishListId of destinationIds) {
          await addRecipeMutation.mutateAsync({
            dishListId,
            recipeId: createdRecipeId,
          });
        }

        toast.success(
          dishListIds.length === 1
            ? "Recipe added to DishList"
            : `Recipe added to ${dishListIds.length} DishLists`,
        );
        setShowDishListPicker(false);
        setRecipeToSave(null);
        createdRecipeIdRef.current = null;
      } catch {
        // Mutation hooks present the error; keep selections open for retry.
      } finally {
        setIsSavingRecipe(false);
      }
    },
    [
      addRecipeMutation,
      createRecipeMutation,
      isSavingRecipe,
      recipeToSave,
    ],
  );

  const handlePreferencesPress = () => {
    setShowPreferences(true);
  };

  const hasMessages = messages.length > 0;
  const latestRecipeMessageId = getLatestRecipeMessageId(messages);

  useEffect(() => {
    if (isGenerating) scrollToBottom();
  }, [isGenerating, scrollToBottom]);

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
        <View style={styles.header}>
          <PreferencesButton onPress={handlePreferencesPress} />
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
              <Text style={styles.emptyTitle}>
                Describe what you want to cook
              </Text>
              <Text style={styles.emptyDescription}>
                We’ll generate a few recipes for you.
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
          {isGenerating && <GeneratedRecipesSkeleton />}

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
            createdRecipeIdRef.current = null;
          }}
          onDone={handleDishListsSelected}
          saving={isSavingRecipe}
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
              size={16}
              color={
                actionsDisabled
                  ? theme.colors.neutral[400]
                  : theme.colors.neutral[600]
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
              size={16}
              color={
                actionsDisabled
                  ? theme.colors.neutral[400]
                  : theme.colors.neutral[600]
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
    minHeight: theme.layout.pageHeaderMinHeight,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  chatArea: {
    flex: 1,
    marginTop: theme.spacing.md,
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
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[800],
    textAlign: "center",
  },
  emptyDescription: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
  },
  // User bubble
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    backgroundColor: theme.colors.primary[600],
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: theme.spacing.md,
  },
  userBubbleText: {
    ...typography.body,
    color: theme.colors.onPrimary,
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
    gap: theme.spacing.xs,
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
  // Error
  errorContainer: {
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: theme.colors.error,
  },
});
