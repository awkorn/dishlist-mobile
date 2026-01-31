import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { User } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { RootStackParamList } from "@app-types/navigation";
import { useFollowUser } from "../hooks/useFollowUser";
import type { FollowListUser, FollowStatus } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FollowListUserItemProps {
  user: FollowListUser;
  showFollowButton?: boolean; // Only show on followers tab
}

export function FollowListUserItem({ user, showFollowButton = false }: FollowListUserItemProps) {
  const navigation = useNavigation<NavigationProp>();
  const { follow, isPending } = useFollowUser({ userId: user.uid });

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "User";

  const handlePress = () => {
    navigation.navigate("Profile", { userId: user.uid });
  };

  const handleFollowPress = () => {
    if (user.followStatus === "NONE") {
      follow();
    }
    // PENDING and ACCEPTED states don't trigger action from this button
  };

  const getButtonConfig = (status: FollowStatus) => {
    switch (status) {
      case "ACCEPTED":
        return {
          text: "Following",
          style: styles.followingButton,
          textStyle: styles.followingButtonText,
          disabled: true,
        };
      case "PENDING":
        return {
          text: "Requested",
          style: styles.requestedButton,
          textStyle: styles.requestedButtonText,
          disabled: true,
        };
      default:
        return {
          text: "Follow Back",
          style: styles.followBackButton,
          textStyle: styles.followBackButtonText,
          disabled: false,
        };
    }
  };

  const buttonConfig = user.followStatus ? getButtonConfig(user.followStatus) : null;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
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

      {/* Follow Button (only on followers tab) */}
      {showFollowButton && buttonConfig && (
        <TouchableOpacity
          style={[styles.button, buttonConfig.style]}
          onPress={handleFollowPress}
          disabled={buttonConfig.disabled || isPending}
          activeOpacity={0.7}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={theme.colors.primary[500]} />
          ) : (
            <Text style={[styles.buttonText, buttonConfig.textStyle]}>
              {buttonConfig.text}
            </Text>
          )}
        </TouchableOpacity>
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.neutral[200],
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  button: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    ...typography.button,
    fontSize: 13,
  },
  // Follow Back - primary action
  followBackButton: {
    backgroundColor: theme.colors.primary[500],
  },
  followBackButtonText: {
    color: "white",
  },
  // Requested - disabled state
  requestedButton: {
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  requestedButtonText: {
    color: theme.colors.neutral[500],
  },
  // Following - disabled state
  followingButton: {
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  followingButtonText: {
    color: theme.colors.neutral[600],
  },
});