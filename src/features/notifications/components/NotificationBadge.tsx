import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Bell } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface NotificationBadgeProps {
  count: number;
  color: string;
  size: number;
}

/**
 * Bell icon with notification badge for tab bar
 * Shows red dot with count when there are unread notifications
 */
export function NotificationBadge({ count, color, size }: NotificationBadgeProps) {
  const showBadge = count > 0;
  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={
        showBadge
          ? `Notifications, ${displayCount} unread`
          : "Notifications"
      }
    >
      <Bell size={size} color={color} />
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: typography.families.uiBold,
    color: theme.colors.onPrimary,
    fontSize: 10,
  },
});
