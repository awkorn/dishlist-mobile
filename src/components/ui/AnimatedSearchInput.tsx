import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableWithoutFeedback,
} from "react-native";
import { Search } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { AnimatedPlaceholder } from "./AnimatedPlaceholder";

interface AnimatedSearchInputProps extends Omit<TextInputProps, "placeholder"> {
  value: string;
  onChangeText: (text: string) => void;
  prefix?: string;
  keywords?: string[];
  staticPlaceholder?: string;
  intervalMs?: number;
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
  ...textInputProps
}: AnimatedSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleContainerPress = () => {
    inputRef.current?.focus();
  };

  const showAnimatedPlaceholder = !isFocused && value.length === 0;

  return (
    <TouchableWithoutFeedback onPress={handleContainerPress}>
      <View style={[styles.container, style]}>
        <Search
          size={20}
          color={theme.colors.neutral[500]}
          style={styles.searchIcon}
        />

        <View style={styles.inputWrapper}>
          {showAnimatedPlaceholder && (
            <View style={styles.placeholderContainer}>
              <AnimatedPlaceholder
                prefix={prefix}
                keywords={keywords}
                intervalMs={intervalMs}
              />
            </View>
          )}

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isFocused || value.length > 0 ? staticPlaceholder : ""}
            placeholderTextColor={theme.colors.neutral[400]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            {...textInputProps}
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.md,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  placeholderContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    pointerEvents: "none",
  },
  input: {
    flex: 1,
    ...typography.body,
    color: theme.colors.neutral[800],
    padding: 0,
  },
});