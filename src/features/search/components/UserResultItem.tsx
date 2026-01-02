import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { User } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { RootStackParamList } from "@app-types/navigation";
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
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      {/* Avatar */}
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <User size={20} color={theme.colors.neutral[400]} />
        </View>
      )}

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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.neutral[200],
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: theme.colors.neutral[100],
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