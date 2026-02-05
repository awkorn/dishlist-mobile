import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Eye, Heart, Handshake } from "lucide-react-native";
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

  const getBadges = () => {
    const badges = [];

    if (dishList.isFollowing) {
      badges.push({
        type: "following",
        icon: Heart,
        color: theme.colors.error,
      });
    }

    if (dishList.isCollaborator) {
      badges.push({
        type: "collaborator",
        icon: Handshake,
        color: theme.colors.success,
      });
    }

    if (dishList.visibility === "PUBLIC") {
      badges.push({
        type: "public",
        icon: Eye,
        color: theme.colors.neutral[500],
      });
    }

    return badges;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {dishList.title}
        </Text>

        <Text style={styles.owner} numberOfLines={1}>
          {ownerName}
        </Text>

        <Text style={styles.stats}>
          {dishList.recipeCount}{" "}
          {dishList.recipeCount === 1 ? "Recipe" : "Recipes"}
          {dishList.followerCount > 0 &&
            ` • ${dishList.followerCount} ${
              dishList.followerCount === 1 ? "Follower" : "Followers"
            }`}
        </Text>

        <View style={styles.badges}>
          {getBadges().map((badge) => (
            <View key={badge.type} style={styles.badge}>
              <badge.icon size={14} color={badge.color} />
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TILE_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  owner: {
    ...typography.caption,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.xs,
  },
  stats: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginBottom: theme.spacing.sm,
  },
  badges: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    minHeight: 22,
  },
  badge: {
    padding: theme.spacing.xs,
  },
});