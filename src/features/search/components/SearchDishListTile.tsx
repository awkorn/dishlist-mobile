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
import Avatar from "@components/ui/Avatar";
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
      activeOpacity={0.82}
    >
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {dishList.title}
        </Text>

        <View style={styles.ownerRow}>
          <Avatar {...dishList.owner} size={24} />
          <Text style={styles.ownerName} numberOfLines={1}>
            {ownerName}
          </Text>
        </View>

        <View style={styles.recipeBadge}>
          <Text style={styles.recipeCount}>
            {dishList.recipeCount}{" "}
            {dishList.recipeCount === 1 ? "recipe" : "recipes"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TILE_WIDTH,
    minHeight: 96,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.collectionCard,
  },
  content: {
    flex: 1,
    alignItems: "flex-start",
    padding: theme.spacing.md,
  },
  title: {
    ...typography.button,
    fontSize: 18,
    lineHeight: 21,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  ownerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  ownerName: {
    ...typography.caption,
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: theme.colors.neutral[600],
  },
  recipeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.collection.tomatoSoft,
    borderRadius: theme.borderRadius.md,
  },
  recipeCount: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.collection.tomato,
  },
});
