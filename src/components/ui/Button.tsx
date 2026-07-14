import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  accessibilityLabel,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles[`${variant}Disabled`],
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          testID="button-loading"
          size="small"
          color={
            variant === "primary" ||
            variant === "secondary" ||
            variant === "destructive"
              ? theme.colors.onPrimary
              : theme.colors.primary[500]
          }
        />
      ) : (
        <>
          {leadingIcon}
          <Text style={textStyles}>{title}</Text>
          {trailingIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  // Variants
  primary: {
    backgroundColor: theme.colors.primary[500],
  },
  secondary: {
    backgroundColor: theme.colors.secondary[50],
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
  },
  ghost: {
    backgroundColor: "transparent",
  },
  destructive: {
    backgroundColor: theme.colors.error,
  },
  // Sizes
  sm: {
    height: 36,
    paddingHorizontal: theme.spacing.md,
  },
  md: {
    height: 44,
    paddingHorizontal: theme.spacing.lg,
  },
  lg: {
    height: 50,
    paddingHorizontal: theme.spacing.xl,
  },
  // Text styles
  text: {
    ...typography.button,
  },
  primaryText: {
    color: theme.colors.onPrimary,
  },
  secondaryText: {
    color: theme.colors.onPrimary,
  },
  outlineText: {
    color: theme.colors.primary[500],
  },
  ghostText: {
    color: theme.colors.primary[500],
  },
  destructiveText: {
    color: theme.colors.onPrimary,
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
  // States
  primaryDisabled: {
    backgroundColor: theme.colors.neutral[200],
  },
  secondaryDisabled: {
    backgroundColor: theme.colors.neutral[200],
  },
  outlineDisabled: {
    backgroundColor: "transparent",
    borderColor: theme.colors.neutral[300],
  },
  ghostDisabled: {
    backgroundColor: "transparent",
  },
  destructiveDisabled: {
    backgroundColor: theme.colors.neutral[200],
  },
  disabledText: {
    color: theme.colors.neutral[500],
  },
});
