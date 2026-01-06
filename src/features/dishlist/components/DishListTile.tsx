import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Eye, Lock, Crown, Users, Heart, Pin } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
import { ComponentErrorBoundary } from "@providers/ErrorBoundary";
import { RootStackParamList } from "@app-types/navigation";
import type { DishList } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DishListTileProps {
  dishList: DishList;
  onPress?: (dishList: DishList) => void;
  /** Compact size for discovery mode (viewing others' profiles) */
  compact?: boolean;
}

const { width } = Dimensions.get("window");
const tileWidth = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;
const COMPACT_WIDTH = 160;

function DishListTileContent({ dishList, onPress, compact = false }: DishListTileProps) {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    if (onPress) {
      onPress(dishList);
    } else {
      navigation.navigate("DishListDetail", { dishListId: dishList.id });
    }
  };

  // Full badges for own profile, simplified for others' profiles
  const getBadges = () => {
    const badges = [];

    if (compact) {
      // Simplified badges for discovery mode
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
          icon: Users,
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
    } else {
      // Full badges for own profile
      if (dishList.isPinned) {
        badges.push({
          type: "pinned",
          icon: Pin,
          color: theme.colors.secondary[50],
        });
      }

      if (dishList.isOwner) {
        badges.push({ type: "owner", icon: Crown, color: theme.colors.warning });
      } else if (dishList.isCollaborator) {
        badges.push({
          type: "collaborator",
          icon: Users,
          color: theme.colors.success,
        });
      } else if (dishList.isFollowing) {
        badges.push({
          type: "following",
          icon: Heart,
          color: theme.colors.error,
        });
      }

      if (dishList.visibility === "PUBLIC") {
        badges.push({
          type: "public",
          icon: Eye,
          color: theme.colors.neutral[500],
        });
      } else {
        badges.push({
          type: "private",
          icon: Lock,
          color: theme.colors.neutral[500],
        });
      }
    }

    return badges;
  };

  const containerStyle = compact ? styles.containerCompact : styles.container;

  return (
    <TouchableOpacity style={containerStyle} onPress={handlePress}>
      <View style={compact ? styles.contentCompact : styles.content}>
        <Text 
          style={compact ? styles.titleCompact : styles.title} 
          numberOfLines={2}
        >
          {dishList.title}
        </Text>

        <Text style={compact ? styles.recipeCountCompact : styles.recipeCount}>
          {dishList.recipeCount}{" "}
          {dishList.recipeCount === 1 ? "Recipe" : "Recipes"}
        </Text>

        <View style={styles.badges}>
          {getBadges().map((badge, index) => (
            <View
              key={badge.type}
              style={[styles.badge, index > 0 && styles.badgeSpacing]}
            >
              <badge.icon size={compact ? 12 : 14} color={badge.color} />
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function DishListTile(props: DishListTileProps) {
  return (
    <ComponentErrorBoundary
      componentName="DishListTile"
      fallback={
        <View style={[props.compact ? styles.containerCompact : styles.container, styles.errorContainer]}>
          <Text style={styles.errorText}>Unable to load</Text>
        </View>
      }
    >
      <DishListTileContent {...props} />
    </ComponentErrorBoundary>
  );
}

const styles = StyleSheet.create({
  // Full size (own profile)
  container: {
    width: tileWidth,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    minHeight: 48,
  },
  recipeCount: {
    ...typography.body,
    color: theme.colors.neutral[500],
    marginBottom: theme.spacing.md,
  },

  // Compact size (others' profiles - discovery mode)
  containerCompact: {
    width: COMPACT_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  contentCompact: {
    padding: theme.spacing.md,
  },
  titleCompact: {
    ...typography.subtitle,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    minHeight: 40,
  },
  recipeCountCompact: {
    ...typography.caption,
    fontSize: 12,
    color: theme.colors.neutral[500],
    marginBottom: theme.spacing.sm,
  },

  // Shared styles
  badges: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  badge: {
    padding: theme.spacing.xs,
  },
  badgeSpacing: {
    marginLeft: 0,
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