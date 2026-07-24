import React, { useEffect, useRef } from "react";
import {
  Animated,
  TextInput,
  StyleSheet,
  Keyboard,
} from "react-native";
import { SearchInput } from "./SearchInput";

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
      <SearchInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        containerStyle={styles.input}
        showClearButton
        onClear={handleClose}
        clearAccessibilityLabel="Close search"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    overflow: "hidden",
  },
  input: {
    flex: 1,
  },
});
