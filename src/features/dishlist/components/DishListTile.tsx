import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  Crown,
  Globe2,
  Handshake,
  Heart,
  Lock,
  Pin,
  type LucideIcon,
} from "lucide-react-native";
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
const TILE_WIDTH = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;

function getPrimaryStatus(dishList: DishList): {
  label: string;
  Icon: LucideIcon;
} {
  if (dishList.isOwner) return { label: "Owner", Icon: Crown };
  if (dishList.isCollaborator) return { label: "Shared", Icon: Handshake };
  if (dishList.isFollowing) return { label: "Following", Icon: Heart };
  return { label: "Community", Icon: Globe2 };
}

function DishListTileContent({ dishList, onPress }: DishListTileProps) {
  const navigation = useNavigation<NavigationProp>();
  const { label: statusLabel, Icon: StatusIcon } = getPrimaryStatus(dishList);
  const VisibilityIcon =
    dishList.visibility === "PUBLIC" ? Globe2 : Lock;
  const visibilityLabel =
    dishList.visibility === "PUBLIC" ? "Public" : "Private";
  const visibilityColor =
    dishList.visibility === "PUBLIC"
      ? theme.colors.textPrimary
      : theme.colors.textPrimary;

  const handlePress = () => {
    if (onPress) {
      onPress(dishList);
    } else {
      navigation.navigate("DishListDetail", { dishListId: dishList.id });
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`${dishList.title}, ${dishList.recipeCount} ${
        dishList.recipeCount === 1 ? "recipe" : "recipes"
      }, ${statusLabel}, ${visibilityLabel}`}
    >
      <View style={styles.cover}>
        <View style={styles.titleCopy}>
          <Text style={styles.coverTitle} numberOfLines={2}>
            {dishList.title}
          </Text>
          <Text style={styles.recipeCount}>
            {dishList.recipeCount}{" "}
            {dishList.recipeCount === 1 ? "recipe" : "recipes"}
          </Text>
        </View>
        {(dishList.isDefault || dishList.isPinned) && (
          <Pin
            size={14}
            color={theme.colors.textPrimary}
            fill={theme.colors.textPrimary}
            style={styles.pinIcon}
          />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.badges}>
          <View style={styles.statusBadge}>
            <StatusIcon size={12} color={theme.colors.textPrimary} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>

          <Text style={styles.infoDot}>•</Text>

          <View style={styles.visibilityBadge}>
            <VisibilityIcon size={11} color={visibilityColor} />
            <Text style={[styles.visibilityText, { color: visibilityColor }]}>
              {visibilityLabel}
            </Text>
          </View>
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
    width: TILE_WIDTH,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.navyBorder,
    ...theme.shadows.collectionCard,
  },
  cover: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    borderTopLeftRadius: theme.borderRadius.lg - 1,
    borderTopRightRadius: theme.borderRadius.lg - 1,
    marginTop: theme.spacing.sm,
  },
  coverTitle: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
  },
  titleCopy: {
    flex: 1,
    gap: 2,
  },
  pinIcon: {
    marginTop: 2,
    transform: [{ rotate: "32deg" }],
  },
  content: {
    minHeight: 50,
    justifyContent: "center",
    padding: theme.spacing.md,
  },
  recipeCount: {
    ...typography.utilityCaption,
    color: theme.colors.neutral[500],
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoDot: {
    color: theme.colors.neutral[500],
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    minHeight: 24,
  },
  statusText: {
    ...typography.label,
    fontSize: 11,
    lineHeight: 15,
    color: theme.colors.textPrimary,
  },
  visibilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    minHeight: 24,
  },
  visibilityText: {
    ...typography.label,
    fontSize: 11,
    lineHeight: 15,
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
