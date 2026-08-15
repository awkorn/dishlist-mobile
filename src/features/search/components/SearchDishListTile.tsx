import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { RootStackParamList } from "@app-types/navigation";
import type { SearchDishList } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SearchDishListTileProps {
  dishList: SearchDishList;
  onPress?: () => void;
}

const { width } = Dimensions.get("window");
const TILE_WIDTH = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;

export function SearchDishListTile({ dishList, onPress }: SearchDishListTileProps) {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("DishListDetail", { dishListId: dishList.id });
    }
  };

  const ownerName =
    [dishList.owner?.firstName, dishList.owner?.lastName]
      .filter(Boolean)
      .join(" ") ||
    dishList.owner?.username ||
    "Unknown";

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${dishList.title} by ${ownerName}, ${dishList.recipeCount} ${
        dishList.recipeCount === 1 ? "recipe" : "recipes"
      }`}
    >
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {dishList.title}
        </Text>

        <Text style={styles.metadata} numberOfLines={1}>
          {ownerName} • {dishList.recipeCount}{" "}
          {dishList.recipeCount === 1 ? "recipe" : "recipes"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TILE_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.collectionCard,
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  metadata: {
    ...typography.caption,
    color: theme.colors.neutral[600],
  },
});
