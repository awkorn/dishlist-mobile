import React, { useEffect, useRef } from "react";
import {
  Animated,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import { Search, X } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface InlineSearchInputProps {
  isActive: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  placeholder?: string;
}

export function InlineSearchInput({
  isActive,
  value,
  onChangeText,
  onClose,
  placeholder = "Search…",
}: InlineSearchInputProps) {
  const inputRef = useRef<TextInput>(null);
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: isActive ? 1 : 0,
      duration: 220,
      useNativeDriver: false, // Required for flex animation
    }).start(() => {
      if (isActive) {
        inputRef.current?.focus();
      }
    });
  }, [isActive]);

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  // When inactive, render nothing (width 0)
  // When active, flex: 1 fills remaining space
  const containerStyle = {
    flex: expandAnim,
    opacity: expandAnim,
    marginLeft: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
    }),
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Search size={18} color={theme.colors.neutral[400]} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.neutral[400]}
        style={styles.input}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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