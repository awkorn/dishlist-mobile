import React, {
  forwardRef,
  type ReactNode,
  useImperativeHandle,
  useRef,
} from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Search, X } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

export interface SearchInputProps extends Omit<TextInputProps, "style"> {
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  placeholderOverlay?: ReactNode;
  showClearButton?: boolean;
  onClear?: () => void;
  clearAccessibilityLabel?: string;
}

export const SearchInput = forwardRef<TextInput, SearchInputProps>(
  function SearchInput(
    {
      containerStyle,
      inputStyle,
      placeholderOverlay,
      showClearButton,
      onClear,
      clearAccessibilityLabel = "Clear search",
      value,
      onChangeText,
      editable = true,
      placeholderTextColor = theme.colors.neutral[400],
      ...textInputProps
    },
    forwardedRef,
  ) {
    const inputRef = useRef<TextInput>(null);
    const hasValue = typeof value === "string" && value.length > 0;
    const shouldShowClearButton = showClearButton ?? hasValue;

    useImperativeHandle(forwardedRef, () => inputRef.current as TextInput);

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else {
        inputRef.current?.clear();
        onChangeText?.("");
      }
      inputRef.current?.focus();
    };

    return (
      <TouchableWithoutFeedback
        onPress={() => inputRef.current?.focus()}
        accessible={false}
      >
        <View
          style={[
            styles.container,
            !editable && styles.disabledContainer,
            containerStyle,
          ]}
          testID={
            textInputProps.testID
              ? `${textInputProps.testID}-container`
              : undefined
          }
        >
          <Search size={20} color={theme.colors.neutral[500]} />
          <View style={styles.inputWrapper}>
            {placeholderOverlay ? (
              <View style={styles.placeholderOverlay} pointerEvents="none">
                {placeholderOverlay}
              </View>
            ) : null}
            <TextInput
              ref={inputRef}
              style={[styles.input, inputStyle]}
              value={value}
              onChangeText={onChangeText}
              placeholderTextColor={placeholderTextColor}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              editable={editable}
              {...textInputProps}
            />
          </View>
          {shouldShowClearButton ? (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel={clearAccessibilityLabel}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <X size={18} color={theme.colors.neutral[500]} />
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    borderWidth: .3,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  disabledContainer: {
    backgroundColor: theme.colors.neutral[50],
  },
  inputWrapper: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    marginLeft: theme.spacing.sm,
  },
  placeholderOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  clearButton: {
    width: 32,
    height: 32,
    marginRight: -theme.spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
});
