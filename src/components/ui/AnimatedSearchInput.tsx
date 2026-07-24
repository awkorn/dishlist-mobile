import React, { useState } from "react";
import {
  StyleSheet,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { AnimatedPlaceholder } from "./AnimatedPlaceholder";
import { SearchInput } from "./SearchInput";

interface AnimatedSearchInputProps
  extends Omit<TextInputProps, "placeholder" | "style"> {
  value: string;
  onChangeText: (text: string) => void;
  prefix?: string;
  keywords?: string[];
  staticPlaceholder?: string;
  intervalMs?: number;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_KEYWORDS = ["recipes", "ingredients", "tags"];

export function AnimatedSearchInput({
  value,
  onChangeText,
  prefix = "Search",
  keywords = DEFAULT_KEYWORDS,
  staticPlaceholder = "Search...",
  intervalMs = 3000,
  style,
  onFocus,
  onBlur,
  ...textInputProps
}: AnimatedSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: NonNullable<TextInputProps["onFocus"]> = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur: NonNullable<TextInputProps["onBlur"]> = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const showAnimatedPlaceholder = !isFocused && value.length === 0;

  return (
    <SearchInput
      containerStyle={[styles.container, style]}
      value={value}
      onChangeText={onChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={isFocused || value.length > 0 ? staticPlaceholder : ""}
      placeholderOverlay={
        showAnimatedPlaceholder ? (
          <AnimatedPlaceholder
            prefix={prefix}
            keywords={keywords}
            intervalMs={intervalMs}
          />
        ) : undefined
      }
      {...textInputProps}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
