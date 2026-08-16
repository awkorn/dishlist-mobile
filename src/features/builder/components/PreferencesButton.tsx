import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { SlidersHorizontal } from "lucide-react-native";
import { theme } from "@styles/theme";

interface PreferencesButtonProps {
  onPress: () => void;
}

export function PreferencesButton({ onPress }: PreferencesButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Open recipe preferences"
    >
      <SlidersHorizontal size={22} color={theme.colors.primary[500]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
