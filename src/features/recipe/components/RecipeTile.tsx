import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { Clock, Users } from "lucide-react-native";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
import { ComponentErrorBoundary } from "@providers/ErrorBoundary";

interface RecipeTileProps {
  recipe: RecipeTileData;
  onPress?: () => void;
  /** Compact size for discovery mode (viewing others' profiles) */
  compact?: boolean;
}

interface RecipeTileData {
  id: string;
  title: string;
  imageUrl?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
}

const { width } = Dimensions.get("window");
const tileWidth = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;
const COMPACT_WIDTH = 160;

function RecipeTileContent({ recipe, onPress, compact = false }: RecipeTileProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  
  const containerStyle = compact ? styles.containerCompact : styles.container;
  const imageStyle = compact ? styles.imageCompact : styles.image;
  const placeholderStyle = compact ? styles.placeholderImageCompact : styles.placeholderImage;

  return (
    <TouchableOpacity style={containerStyle} onPress={onPress}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={imageStyle} />
      ) : (
        <View style={placeholderStyle}>
          <Text style={styles.placeholderEmoji}>{compact ? "🍽️" : "🍽️"}</Text>
        </View>
      )}

      <View style={compact ? styles.contentCompact : styles.content}>
        <Text style={compact ? styles.titleCompact : styles.title} numberOfLines={2}>
          {recipe.title}
        </Text>

        <View style={styles.metaRow}>
          {totalTime > 0 && (
            <View style={styles.metaItem}>
              <Clock size={compact ? 10 : 12} color={theme.colors.neutral[500]} />
              <Text style={compact ? styles.metaTextCompact : styles.metaText}>
                {totalTime} min
              </Text>
            </View>
          )}
          {recipe.servings && recipe.servings > 0 && (
            <View style={styles.metaItem}>
              <Users size={compact ? 10 : 12} color={theme.colors.neutral[500]} />
              <Text style={compact ? styles.metaTextCompact : styles.metaText}>
                {recipe.servings}
              </Text>
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
        <View style={[props.compact ? styles.containerCompact : styles.container, styles.errorContainer]}>
          <Text style={styles.errorText}>Unable to load recipe</Text>
        </View>
      }
    >
      <RecipeTileContent {...props} />
    </ComponentErrorBoundary>
  );
}

const styles = StyleSheet.create({
  // Full size (own profile)
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
    backgroundColor: theme.colors.neutral[50],
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    ...typography.body,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },

  // Compact size (others' profiles - discovery mode)
  containerCompact: {
    width: COMPACT_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  imageCompact: {
    width: "100%",
    height: COMPACT_WIDTH * 0.7,
    backgroundColor: theme.colors.neutral[200],
  },
  placeholderImageCompact: {
    width: "100%",
    height: COMPACT_WIDTH * 0.7,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  contentCompact: {
    padding: theme.spacing.sm,
  },
  titleCompact: {
    ...typography.body,
    fontSize: 13,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  metaTextCompact: {
    ...typography.caption,
    fontSize: 10,
    color: theme.colors.neutral[500],
  },

  // Shared styles
  placeholderEmoji: {
    fontSize: 32,
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