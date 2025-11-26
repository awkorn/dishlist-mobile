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
}

const { width } = Dimensions.get("window");
const tileWidth = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;

function DishListTileContent({ dishList, onPress }: DishListTileProps) {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    if (onPress) {
      onPress(dishList);
    } else {
      navigation.navigate("DishListDetail", { dishListId: dishList.id });
    }
  };

  const getBadges = () => {
    const badges = [];

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

    return badges;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {dishList.title}
        </Text>

        <Text style={styles.recipeCount}>
          {dishList.recipeCount}{" "}
          {dishList.recipeCount === 1 ? "Recipe" : "Recipes"}
        </Text>

        <View style={styles.badges}>
          {getBadges().map((badge, index) => (
            <View
              key={badge.type}
              style={[styles.badge, index > 0 && styles.badgeSpacing]}
            >
              <badge.icon size={14} color={badge.color} />
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
        <View style={[styles.container, styles.errorContainer]}>
          <Text style={styles.errorText}>Unable to load</Text>
        </View>
      }
    >
      <DishListTileContent {...props} />
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
