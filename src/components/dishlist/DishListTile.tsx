import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Eye, Lock, Crown, Users, Heart, Pin } from "lucide-react-native";
import { typography } from "../../styles/typography";
import { theme } from "../../styles/theme";
import { ComponentErrorBoundary } from "../../providers/ErrorBoundary";

interface DishListTileProps {
  dishList: {
    id: string;
    title: string;
    recipeCount: number;
    isDefault: boolean;
    isPinned: boolean;
    isOwner: boolean;
    isCollaborator: boolean;
    isFollowing: boolean;
    visibility: "PUBLIC" | "PRIVATE";
  };
}

const { width } = Dimensions.get("window");
const tileWidth = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;

export default function DishListTile({ dishList }: DishListTileProps) {
  const getBadges = () => {
    const badges = [];

    // Pin badge (show first if pinned)
    if (dishList.isPinned) {
      badges.push({
        type: "pinned",
        icon: Pin,
        color: theme.colors.secondary[50],
      });
    }

    // Ownership badges
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

    // Visibility badges
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

    return badges;
  };

  return (
    <ComponentErrorBoundary
      componentName="DishListTile"
      fallback={
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center" },
          ]}
        >
          <Text style={styles.errorText}>Unable to load</Text>
        </View>
      }
    >
      <TouchableOpacity style={styles.container}></TouchableOpacity>
      <TouchableOpacity style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {dishList.title}
          </Text>

          <Text style={styles.recipeCount}>
            {dishList.recipeCount}{" "}
            {dishList.recipeCount === 1 ? "recipe" : "recipes"}
          </Text>

          <View style={styles.badges}>
            {getBadges().map((badge, index) => {
              const IconComponent = badge.icon;
              return (
                <View key={`${badge.type}-${index}`} style={styles.badge}>
                  <IconComponent size={12} color={badge.color} />
                </View>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </ComponentErrorBoundary>
  );
}

const styles = StyleSheet.create({
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
  badges: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  badge: {
    padding: theme.spacing.xs,
    borderRadius: 6,
    backgroundColor: theme.colors.neutral[100],
  },
  errorText: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
});
