import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Square } from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';

interface GroceryInputRowProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onBlur: () => void;
  autoFocus?: boolean;
}

export function GroceryInputRow({
  value,
  onChangeText,
  onSubmit,
  onBlur,
  autoFocus = true,
}: GroceryInputRowProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  return (
    <View style={styles.container}>
      <View style={styles.checkbox}>
        <Square size={24} color={theme.colors.neutral[300]} />
      </View>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder="Item name"
        placeholderTextColor={theme.colors.neutral[400]}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onBlur={onBlur}
        returnKeyType="done"
        autoCapitalize="sentences"
        testID="grocery-input"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
  },
  checkbox: {
    padding: theme.spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body,
    fontSize: 16,
    color: theme.colors.neutral[800],
    paddingVertical: 0,
  },
});