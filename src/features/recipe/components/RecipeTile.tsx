import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import Svg, { Line, Path } from "react-native-svg";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
import { ComponentErrorBoundary } from "@providers/ErrorBoundary";

interface RecipeTileProps {
  recipe: RecipeTileData;
  onPress?: () => void;
}

interface RecipeTileData {
  id: string;
  title: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  prepTime?: number | null;
  cookTime?: number | null;
  servings?: number | null;
}

const { width } = Dimensions.get("window");
const GRID_GAP = theme.spacing.lg;
const IMAGE_ASPECT_RATIO = 4 / 3;
const TILE_WIDTH = (width - theme.spacing.xl * 2 - GRID_GAP) / 2;
const TILE_HEIGHT =
  TILE_WIDTH / IMAGE_ASPECT_RATIO + theme.spacing.sm + 36;

function RecipeTileContent({ recipe, onPress }: RecipeTileProps) {
  const coverImageUrl = recipe.imageUrls?.[0] || recipe.imageUrl;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Recipe: ${recipe.title}`}
    >
      {coverImageUrl ? (
        <Image
          source={{ uri: coverImageUrl }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={recipe.id}
          accessibilityLabel={`${recipe.title} image`}
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Svg
            testID="recipe-placeholder-art"
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
      )}

      <View testID="recipe-tile-content" style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>
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
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
  },
  image: {
    width: "100%",
    aspectRatio: IMAGE_ASPECT_RATIO,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.neutral[200],
  },
  placeholderImage: {
    width: "100%",
    aspectRatio: IMAGE_ASPECT_RATIO,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    justifyContent: "flex-start",
    paddingTop: theme.spacing.sm,
  },
  title: {
    ...typography.recipeCardTitle,
    height: 36,
    fontSize: 14,
    lineHeight: 18,
    color: theme.colors.textPrimary,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    ...typography.caption,
    color: theme.colors.error,
  },
});
