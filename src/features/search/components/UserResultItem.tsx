import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { RootStackParamList } from "@app-types/navigation";
import Avatar from "@components/ui/Avatar";
import type { SearchUser } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserResultItemProps {
  user: SearchUser;
  onPress?: () => void;
}

export function UserResultItem({ user, onPress }: UserResultItemProps) {
  const navigation = useNavigation<NavigationProp>();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("Profile", { userId: user.uid });
    }
  };

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "User";

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={
        user.isFollowing ? `${displayName}, following` : displayName
      }
    >
      {/* Avatar */}
      <Avatar {...user} size={44} />

      {/* User Info */}
      <View style={styles.info}>
        <Text style={styles.displayName} numberOfLines={1}>
          {displayName}
        </Text>
        {user.username && (
          <Text style={styles.username} numberOfLines={1}>
            @{user.username}
          </Text>
        )}
      </View>

      {/* Following Badge */}
      {user.isFollowing && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Following</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  info: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  displayName: {
    ...typography.subtitle,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  username: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginTop: 2,
  },
  badge: {
    backgroundColor: theme.colors.neutral[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    color: theme.colors.neutral[600],
  },
});
