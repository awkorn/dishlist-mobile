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
  titleAlign?: "center" | "left";
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export function ScreenHeader({
  title,
  leftSlot,
  rightSlot,
  titleAlign = "center",
  style,
  titleStyle,
  numberOfLines = 1,
}: ScreenHeaderProps) {
  const isLeftAligned = titleAlign === "left";

  return (
    <View style={[styles.header, style]}>
      <View
        style={[styles.leftSlot, isLeftAligned && styles.collapsedLeftSlot]}
        testID="screen-header-left-slot"
      >
        {leftSlot}
      </View>
      <Text
        style={[
          styles.title,
          isLeftAligned && styles.leftAlignedTitle,
          titleStyle,
        ]}
        numberOfLines={numberOfLines}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <View
        style={[styles.rightSlot, isLeftAligned && styles.compactRightSlot]}
        testID="screen-header-right-slot"
      >
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
  collapsedLeftSlot: {
    flex: 0,
    minWidth: 0,
  },
  rightSlot: {
    flex: 1,
    minWidth: 44,
    minHeight: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  compactRightSlot: {
    flex: 0,
    marginLeft: theme.spacing.md,
  },
  title: {
    ...typography.navigationTitle,
    flexShrink: 1,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  leftAlignedTitle: {
    flex: 1,
    textAlign: "left",
  },
  action: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
