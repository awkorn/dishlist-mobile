import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { useFollowUser } from "../hooks/useFollowUser";

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
}

export function FollowButton({ userId, isFollowing }: FollowButtonProps) {
  const { mutate, isPending } = useFollowUser({ userId, isFollowing });

  const handlePress = () => {
    mutate();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isFollowing ? styles.followingButton : styles.followButton,
      ]}
      onPress={handlePress}
      disabled={isPending}
      activeOpacity={0.7}
    >
      {isPending ? (
        <ActivityIndicator
          size="small"
          color={isFollowing ? theme.colors.neutral[600] : "white"}
        />
      ) : (
        <>
          <Text
            style={[
              styles.buttonText,
              isFollowing ? styles.followingText : styles.followText,
            ]}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    minWidth: 110,
    minHeight: 36,
  },
  followButton: {
    backgroundColor: theme.colors.primary[500],
  },
  followingButton: {
    backgroundColor: theme.colors.primary[50],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  buttonText: {
    ...typography.button,
    fontSize: 14,
  },
  followText: {
    color: "white",
  },
  followingText: {
    color: theme.colors.neutral[600],
  },
});
