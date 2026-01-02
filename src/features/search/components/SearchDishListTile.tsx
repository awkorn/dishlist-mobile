import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Eye, Heart, Users } from "lucide-react-native";
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
  /** Compact size for horizontal scroll in ALL tab */
  compact?: boolean;
}

export function SearchDishListTile({ dishList, onPress, compact = false }: SearchDishListTileProps) {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("DishListDetail", { dishListId: dishList.id });
    }
  };

  const ownerName = [dishList.owner?.firstName, dishList.owner?.lastName]
    .filter(Boolean)
    .join(" ") || dishList.owner?.username || "Unknown";

  const getBadges = () => {
    const badges = [];

    // Following badge
    if (dishList.isFollowing) {
      badges.push({
        type: "following",
        icon: Heart,
        color: theme.colors.error,
      });
    }

    // Collaborator badge
    if (dishList.isCollaborator) {
      badges.push({
        type: "collaborator",
        icon: Users,
        color: theme.colors.success,
      });
    }

    // Public badge
    if (dishList.visibility === "PUBLIC") {
      badges.push({
        type: "public",
        icon: Eye,
        color: theme.colors.neutral[500],
      });
    }

    return badges;
  };

  const tileStyle = compact ? styles.containerCompact : styles.container;

  return (
    <TouchableOpacity style={tileStyle} onPress={handlePress}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
          {dishList.title}
        </Text>

        <Text style={styles.owner} numberOfLines={1}>
          {ownerName}
        </Text>

        <Text style={styles.stats}>
          {dishList.recipeCount} {dishList.recipeCount === 1 ? "Recipe" : "Recipes"}
          {dishList.followerCount > 0 && ` • ${dishList.followerCount} ${dishList.followerCount === 1 ? "Follower" : "Followers"}`}
        </Text>

        {/* Badges */}
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

const TILE_WIDTH = 160;
const COMPACT_WIDTH = 150;

const styles = StyleSheet.create({
  container: {
    width: TILE_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  containerCompact: {
    width: COMPACT_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
    marginRight: theme.spacing.md,
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
  owner: {
    ...typography.caption,
    fontSize: 12,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.xs,
  },
  stats: {
    ...typography.caption,
    fontSize: 11,
    color: theme.colors.neutral[500],
    marginBottom: theme.spacing.sm,
  },
  badges: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  badge: {
    padding: theme.spacing.xs,
  },
});