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
}

const { width } = Dimensions.get("window");
const TILE_WIDTH = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;

export function SearchRecipeTile({ recipe, onPress }: SearchRecipeTileProps) {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("RecipeDetail", { recipeId: recipe.id });
    }
  };

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      {recipe.imageUrl ? (
        <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholderImage]}>
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
              <Users size={12} color={theme.colors.neutral[500]} />
              <Text style={styles.metaText}>{recipe.servings}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TILE_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  image: {
    width: "100%",
    height: TILE_WIDTH * 0.75,
    backgroundColor: theme.colors.neutral[200],
  },
  placeholderImage: {
    backgroundColor: theme.colors.neutral[50],
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
    ...typography.body,
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
});