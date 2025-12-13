import React, { useEffect, useRef } from "react";
import {
  Animated,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Search, X } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface InlineSearchInputProps {
  isActive: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
}

export function InlineSearchInput({
  isActive,
  value,
  onChangeText,
  onClose,
}: InlineSearchInputProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);
  const growAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(growAnim, {
      toValue: isActive ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      if (isActive) inputRef.current?.focus();
    });
  }, [isActive]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          flexGrow: growAnim,
          opacity: growAnim,
        },
      ]}
    >
      <Search size={18} color={theme.colors.neutral[400]} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search…"
        placeholderTextColor={theme.colors.neutral[400]}
        style={styles.input}
        returnKeyType="search"
      />
      <TouchableOpacity onPress={onClose}>
        <X size={18} color={theme.colors.neutral[500]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 10,
    height: 40,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    ...typography.body,
    color: theme.colors.neutral[800],
    padding: 0,
  },
});
