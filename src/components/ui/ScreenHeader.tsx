import React, { type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type TextStyle,
  type TouchableOpacityProps,
  type ViewStyle,
  View,
} from "react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface ScreenHeaderProps {
  title: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export function ScreenHeader({
  title,
  leftSlot,
  rightSlot,
  style,
  titleStyle,
  numberOfLines = 1,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.leftSlot} testID="screen-header-left-slot">
        {leftSlot}
      </View>
      <Text
        style={[styles.title, titleStyle]}
        numberOfLines={numberOfLines}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <View style={styles.rightSlot} testID="screen-header-right-slot">
        {rightSlot}
      </View>
    </View>
  );
}

interface ScreenHeaderActionProps extends TouchableOpacityProps {
  children: ReactNode;
}

export function ScreenHeaderAction({
  children,
  style,
  ...props
}: ScreenHeaderActionProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[styles.action, style]}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  leftSlot: {
    flex: 1,
    minWidth: 44,
    minHeight: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  rightSlot: {
    flex: 1,
    minWidth: 44,
    minHeight: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  title: {
    ...typography.editorialNavigationTitle,
    flexShrink: 1,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  action: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
