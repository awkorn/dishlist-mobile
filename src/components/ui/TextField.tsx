import React, { forwardRef } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface TextFieldProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  invalid?: boolean;
  helperText?: string;
  showCharacterCount?: boolean;
  rightElement?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField(
    {
      label,
      required = false,
      error,
      invalid = false,
      helperText,
      showCharacterCount = false,
      rightElement,
      containerStyle,
      inputContainerStyle,
      style,
      placeholderTextColor = theme.colors.neutral[400],
      value,
      defaultValue,
      maxLength,
      accessibilityLabel,
      testID,
      ...inputProps
    },
    ref,
  ) {
    const textValue = typeof value === "string" ? value : defaultValue ?? "";
    const counter = showCharacterCount
      ? maxLength
        ? `${textValue.length}/${maxLength}`
        : `${textValue.length}`
      : null;
    const supportingText = error || helperText;

    return (
      <View style={containerStyle}>
        {label ? (
          <Text style={styles.label}>
            {label}
            {required ? <Text style={styles.required}> *</Text> : null}
          </Text>
        ) : null}

        <View
          testID={testID ? `${testID}-container` : undefined}
          style={[
            styles.inputContainer,
            error || invalid ? styles.inputContainerError : null,
            inputContainerStyle,
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            value={value}
            defaultValue={defaultValue}
            maxLength={maxLength}
            placeholderTextColor={placeholderTextColor}
            accessibilityLabel={accessibilityLabel ?? label}
            testID={testID}
            {...inputProps}
          />
          {rightElement}
        </View>

        {supportingText || counter ? (
          <View style={styles.supportingRow}>
            {supportingText ? (
              <Text
                style={[styles.supportingText, error ? styles.errorText : null]}
                accessibilityRole={error ? "alert" : undefined}
              >
                {supportingText}
              </Text>
            ) : (
              <View style={styles.supportingSpacer} />
            )}
            {counter ? <Text style={styles.counter}>{counter}</Text> : null}
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    fontSize: 16,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  input: {
    ...typography.body,
    flex: 1,
    padding: theme.spacing.lg,
    color: theme.colors.neutral[800],
  },
  supportingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  supportingText: {
    ...typography.caption,
    flex: 1,
    color: theme.colors.neutral[500],
  },
  errorText: {
    color: theme.colors.error,
  },
  supportingSpacer: {
    flex: 1,
  },
  counter: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    textAlign: "right",
  },
});
