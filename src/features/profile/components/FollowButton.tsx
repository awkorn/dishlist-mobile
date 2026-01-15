import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { useFollowUser } from "../hooks/useFollowUser";
import type { FollowStatus } from "../types";

interface FollowButtonProps {
  userId: string;
  followStatus: FollowStatus;
}

export function FollowButton({ userId, followStatus }: FollowButtonProps) {
  const { follow, unfollow, isPending } = useFollowUser({ userId });

  const handlePress = () => {
    if (followStatus === "NONE") {
      // Send follow request
      follow();
    } else if (followStatus === "PENDING") {
      // Cancel pending request
      Alert.alert(
        "Cancel Request",
        "Do you want to cancel your follow request?",
        [
          { text: "No", style: "cancel" },
          { 
            text: "Yes, Cancel", 
            style: "destructive",
            onPress: () => unfollow()
          },
        ]
      );
    } else {
      // Unfollow
      Alert.alert(
        "Unfollow",
        "Are you sure you want to unfollow this user?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Unfollow", 
            style: "destructive",
            onPress: () => unfollow()
          },
        ]
      );
    }
  };

  const getButtonStyle = () => {
    switch (followStatus) {
      case "ACCEPTED":
        return styles.followingButton;
      case "PENDING":
        return styles.requestedButton;
      default:
        return styles.followButton;
    }
  };

  const getTextStyle = () => {
    switch (followStatus) {
      case "ACCEPTED":
        return styles.followingText;
      case "PENDING":
        return styles.requestedText;
      default:
        return styles.followText;
    }
  };

  const getButtonText = () => {
    switch (followStatus) {
      case "ACCEPTED":
        return "Following";
      case "PENDING":
        return "Requested";
      default:
        return "Follow";
    }
  };

  const getSpinnerColor = () => {
    return followStatus === "NONE" ? "white" : theme.colors.neutral[600];
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle()]}
      onPress={handlePress}
      disabled={isPending}
      activeOpacity={0.7}
    >
      {isPending ? (
        <ActivityIndicator size="small" color={getSpinnerColor()} />
      ) : (
        <Text style={[styles.buttonText, getTextStyle()]}>
          {getButtonText()}
        </Text>
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
  requestedButton: {
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
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
  requestedText: {
    color: theme.colors.neutral[500],
  },
});