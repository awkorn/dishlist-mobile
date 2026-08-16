import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Clock, Users } from "lucide-react-native";
import Svg, { Line, Path } from "react-native-svg";
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
      {/* Recipe placeholder */}
      <View style={styles.placeholderContainer}>
        <Svg
          testID="builder-recipe-placeholder-art"
          width="40%"
          height="46%"
          viewBox="0 0 160 120"
          accessible={false}
        >
          <Path
            d="M25 28 H135 C135 70 111 94 80 94 C49 94 25 70 25 28 Z"
            fill="none"
            stroke={theme.colors.recipePlaceholderBowl}
            strokeWidth={8}
            strokeLinejoin="round"
          />
          <Line
            x1={35}
            y1={109}
            x2={125}
            y2={109}
            stroke={theme.colors.recipePlaceholderBowl}
            strokeWidth={8}
            strokeLinecap="round"
          />
        </Svg>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>

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
  placeholderContainer: {
    width: "100%",
    height: CARD_WIDTH * 0.55,
    backgroundColor: theme.colors.neutral[50],
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    ...typography.recipeCardTitle,
    fontSize: 14,
    lineHeight: 19,
    color: theme.colors.textPrimary,
    marginBottom: 4,
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
    ...typography.utilityCaption,
    fontSize: 11,
    color: theme.colors.neutral[500],
  },
});
