import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { SlidersHorizontal } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface PreferencesButtonProps {
  onPress: () => void;
  activeCount?: number;
}

export function PreferencesButton({
  onPress,
  activeCount = 0,
}: PreferencesButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Open recipe preferences"
    >
      <SlidersHorizontal size={14} color={theme.colors.onPrimary} />
      <Text style={styles.text}>
        Preferences{activeCount > 0 ? ` (${activeCount})` : ""}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  text: {
    ...typography.caption,
    fontFamily: "Inter-Medium",
    color: theme.colors.onPrimary,
    fontSize: 13,
  },
});
