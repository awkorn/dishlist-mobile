import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Clock, CookingPot } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { RootStackParamList } from "@app-types/navigation";
import type { SearchRecipe } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SearchRecipeTileProps {
  recipe: SearchRecipe;
  onPress?: () => void;
  /** Compact size for horizontal scroll in ALL tab */
  compact?: boolean;
}

export function SearchRecipeTile({ recipe, onPress, compact = false }: SearchRecipeTileProps) {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("RecipeDetail", { recipeId: recipe.id });
    }
  };

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const creatorName = [recipe.creator?.firstName, recipe.creator?.lastName]
    .filter(Boolean)
    .join(" ") || recipe.creator?.username || "Unknown";

  const tileStyle = compact ? styles.containerCompact : styles.container;
  const imageStyle = compact ? styles.imageCompact : styles.image;

  return (
    <TouchableOpacity style={tileStyle} onPress={handlePress}>
      {/* Image */}
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={imageStyle} />
      ) : (
        <View style={[imageStyle, styles.placeholderImage]}>
          <Text style={styles.placeholderEmoji}>🍽️</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
          {recipe.title}
        </Text>

        <Text style={styles.creator} numberOfLines={1}>
          By {creatorName}
        </Text>

        <View style={styles.metaRow}>
          {totalTime > 0 && (
            <View style={styles.metaItem}>
              <Clock size={10} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>{totalTime} min</Text>
            </View>
          )}
          {recipe.servings && recipe.servings > 0 && (
            <View style={styles.metaItem}>
              <CookingPot size={10} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>{recipe.servings}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Standard tile width (same as existing RecipeTile)
const TILE_WIDTH = 160;
const COMPACT_WIDTH = 140;

const styles = StyleSheet.create({
  container: {
    width: TILE_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  containerCompact: {
    width: COMPACT_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    ...theme.shadows.sm,
    marginRight: theme.spacing.md,
  },
  image: {
    width: "100%",
    height: TILE_WIDTH * 0.7,
    backgroundColor: theme.colors.neutral[200],
  },
  imageCompact: {
    width: "100%",
    height: COMPACT_WIDTH * 0.65,
    backgroundColor: theme.colors.neutral[200],
  },
  placeholderImage: {
    backgroundColor: theme.colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderEmoji: {
    fontSize: 28,
  },
  content: {
    padding: theme.spacing.sm,
  },
  title: {
    ...typography.subtitle,
    fontSize: 13,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  creator: {
    ...typography.caption,
    fontSize: 11,
    color: theme.colors.neutral[500],
    marginBottom: theme.spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    ...typography.caption,
    fontSize: 10,
    color: theme.colors.neutral[500],
  },
});