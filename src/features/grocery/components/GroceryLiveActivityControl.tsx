import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LockKeyhole } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface GroceryLiveActivityControlProps {
  isActive: boolean;
  isChanging: boolean;
  uncheckedCount: number;
  onStart: () => void;
  onEnd: () => void;
}

export function GroceryLiveActivityControl({
  isActive,
  isChanging,
  uncheckedCount,
  onStart,
  onEnd,
}: GroceryLiveActivityControlProps) {
  return (
    <View style={styles.container}>
      <LockKeyhole
        size={17}
        color={isActive ? theme.colors.successText : theme.colors.neutral[500]}
      />

      <View style={styles.copy}>
        <Text style={styles.title}>Lock Screen list</Text>
        {isActive ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {`${uncheckedCount} ${uncheckedCount === 1 ? "item" : "items"} remaining`}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        testID={isActive ? "end-shopping-mode" : "start-shopping-mode"}
        style={[
          styles.switchTrack,
          isActive && styles.switchTrackActive,
          isChanging && styles.switchTrackDisabled,
        ]}
        onPress={isActive ? onEnd : onStart}
        disabled={isChanging}
        accessibilityRole="switch"
        accessibilityLabel={
          isActive ? "Remove grocery list from Lock Screen" : "Add grocery list to Lock Screen"
        }
        accessibilityState={{
          busy: isChanging,
          checked: isActive,
          disabled: isChanging,
        }}
      >
        <View
          style={[styles.switchThumb, isActive && styles.switchThumbActive]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    minHeight: 46,
    marginHorizontal: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.navyBorder,
    marginBottom: theme.spacing.xs,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...typography.button,
    fontSize: 13,
    lineHeight: 17,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 15,
    color: theme.colors.neutral[600],
  },
  switchTrack: {
    width: 46,
    height: 28,
    padding: 3,
    borderRadius: 14,
    justifyContent: "center",
    backgroundColor: theme.colors.neutral[300],
  },
  switchTrackActive: {
    backgroundColor: theme.colors.textPrimary,
  },
  switchTrackDisabled: {
    opacity: 0.55,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  switchThumbActive: {
    transform: [{ translateX: 18 }],
  },
});
