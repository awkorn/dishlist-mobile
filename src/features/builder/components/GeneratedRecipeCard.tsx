import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Clock, Users } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import type { GeneratedRecipe } from "../types";

interface GeneratedRecipeCardProps {
  recipe: GeneratedRecipe;
  onPress: () => void;
}

const { width } = Dimensions.get("window");
const CARD_GAP = theme.spacing.md;
const HORIZONTAL_PADDING = theme.spacing.xl;
const CARD_WIDTH = (width - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

export function GeneratedRecipeCard({
  recipe,
  onPress,
}: GeneratedRecipeCardProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const ingredientCount = recipe.ingredients.filter(
    (i) => i.type === "item"
  ).length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Emoji placeholder */}
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>🍽️</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>

        {recipe.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {totalTime > 0 && (
            <View style={styles.metaItem}>
              <Clock size={11} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>{totalTime} min</Text>
            </View>
          )}
          {recipe.servings && recipe.servings > 0 && (
            <View style={styles.metaItem}>
              <Users size={11} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>{recipe.servings}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {recipe.tags.slice(0, 2).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export { CARD_WIDTH, CARD_GAP };

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  emojiContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.55,
    backgroundColor: theme.colors.neutral[50],
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 32,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    ...typography.body,
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    ...typography.caption,
    fontSize: 12,
    color: theme.colors.neutral[500],
    marginBottom: 6,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    ...typography.caption,
    fontSize: 11,
    color: theme.colors.neutral[500],
  },
  tagsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    ...typography.caption,
    fontSize: 10,
    color: theme.colors.primary[600],
  },
});
