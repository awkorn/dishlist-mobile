import React, { ReactNode } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface SettingsRowBaseProps {
  icon?: ReactNode;
  label: string;
  subtitle?: string;
  destructive?: boolean;
  showDivider?: boolean;
}

interface SettingsRowNavigateProps extends SettingsRowBaseProps {
  type?: "navigate";
  onPress: () => void;
  rightText?: string;
  /** Show a spinner (instead of the chevron) and block taps while a row-level
   *  action is in flight — e.g. account deletion. */
  loading?: boolean;
  disabled?: boolean;
}

interface SettingsRowToggleProps extends SettingsRowBaseProps {
  type: "toggle";
  value: boolean;
  onValueChange: (value: boolean) => void;
}

interface SettingsRowStaticProps extends SettingsRowBaseProps {
  type: "static";
  rightText?: string;
}

type SettingsRowProps =
  | SettingsRowNavigateProps
  | SettingsRowToggleProps
  | SettingsRowStaticProps;

export function SettingsRow(props: SettingsRowProps) {
  const { icon, label, subtitle, destructive = false, showDivider = true } = props;

  const isNavigate = props.type === undefined || props.type === "navigate";
  const loading = isNavigate && "loading" in props ? props.loading === true : false;
  const disabled =
    isNavigate && "disabled" in props ? props.disabled === true : false;

  const labelColor = destructive
    ? theme.colors.error
    : theme.colors.neutral[800];

  const content = (
    <View
      style={[
        styles.row,
        showDivider && styles.divider,
        (loading || disabled) && styles.rowDisabled,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {/* Right side */}
      {props.type === "toggle" ? (
        <Switch
          value={props.value}
          onValueChange={props.onValueChange}
          trackColor={{
            false: theme.colors.neutral[200],
            true: theme.colors.primary[500],
          }}
          thumbColor={theme.colors.surface}
          accessibilityLabel={label}
        />
      ) : (
        <View style={styles.rightContainer}>
          {"rightText" in props && props.rightText && (
            <Text style={styles.rightText}>{props.rightText}</Text>
          )}
          {isNavigate &&
            (loading ? (
              <ActivityIndicator size="small" color={theme.colors.neutral[400]} />
            ) : (
              <ChevronRight size={18} color={theme.colors.neutral[400]} />
            ))}
        </View>
      )}
    </View>
  );

  // Navigate rows are pressable
  if (props.type === undefined || props.type === "navigate") {
    return (
      <TouchableOpacity
        onPress={props.onPress}
        activeOpacity={0.6}
        disabled={loading || disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: loading || disabled, busy: loading }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 48,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.neutral[200],
  },
  rowDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 30,
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    ...typography.body,
    fontSize: 15,
  },
  subtitle: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  rightText: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
});
