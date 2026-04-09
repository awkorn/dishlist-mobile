import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Easing,
} from "react-native";
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
    clearChat,
    preferences,
  } = useRecipeBuilder();

  const [selectedRecipe, setSelectedRecipe] = useState<GeneratedRecipe | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);
  const [showDishListPicker, setShowDishListPicker] = useState(false);
  const [recipeToSave, setRecipeToSave] = useState<GeneratedRecipe | null>(
    null
  );

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
    // Static for now — will open preferences modal in Phase 2
    Alert.alert(
      "Preferences",
      "Dietary preferences coming soon! You'll be able to set preferences like Vegan, High Protein, Gluten-Free, and more.",
      [{ text: "OK" }]
    );
  };

  const hasMessages = messages.length > 0;

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
              />
            ))
          )}

          {/* Loading animation */}
          {isGenerating && (
            <View style={styles.loadingContainer}>
              <SaladBowlLoader />
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
}

function MessageBubble({ message, onRecipePress }: MessageBubbleProps) {
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
    </View>
  );
}

// ─── Pulsing Dots Loader ──────────────────────────────────────────
const DOT_COLORS = [
  theme.colors.primary[500],
  theme.colors.primary[600],
  theme.colors.primary[500],
];

function SaladBowlLoader() {
  const dotAnims = useRef(DOT_COLORS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    dotAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={loaderStyles.wrapper}>
      <View style={loaderStyles.dotsRow}>
        {DOT_COLORS.map((color, i) => {
          const scale = dotAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.4],
          });
          const opacity = dotAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
          });
          return (
            <Animated.View
              key={i}
              style={[
                loaderStyles.dot,
                {
                  backgroundColor: color,
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={loaderStyles.label}>Finding recipes...</Text>
    </View>
  );
}

const loaderStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing["4xl"],
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing.lg,
    fontStyle: "italic",
  },
});

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
  // Loading
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
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
