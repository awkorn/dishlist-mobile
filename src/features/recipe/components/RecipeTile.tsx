import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { Clock, CookingPot } from "lucide-react-native";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
import { ComponentErrorBoundary } from "@providers/ErrorBoundary";
import type { Recipe } from "../types";

interface RecipeTileProps {
  recipe: Recipe;
  onPress?: () => void;
}

const { width } = Dimensions.get("window");
const tileWidth = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;

function RecipeTileContent({ recipe, onPress }: RecipeTileProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderEmoji}>🍽️</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>

        <View style={styles.metaRow}>
          {totalTime > 0 && (
            <View style={styles.metaItem}>
              <Clock size={12} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>{totalTime} min</Text>
            </View>
          )}
          {recipe.servings && recipe.servings > 0 && (
            <View style={styles.metaItem}>
              <CookingPot size={12} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>{recipe.servings}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RecipeTile(props: RecipeTileProps) {
  return (
    <ComponentErrorBoundary
      componentName="RecipeTile"
      fallback={
        <View style={[styles.container, styles.errorContainer]}>
          <Text style={styles.errorText}>Unable to load recipe</Text>
        </View>
      }
    >
      <RecipeTileContent {...props} />
    </ComponentErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    width: tileWidth,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  image: {
    width: "100%",
    height: tileWidth * 0.75,
    backgroundColor: theme.colors.neutral[200],
  },
  placeholderImage: {
    width: "100%",
    height: tileWidth * 0.75,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    ...typography.subtitle,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: tileWidth * 0.75 + 60,
  },
  errorText: {
    ...typography.caption,
    color: theme.colors.error,
  },
});
