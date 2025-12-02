import React, { useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { CheckSquare, Square, Trash2 } from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import type { GroceryItem } from '../types';

interface GroceryItemRowProps {
  item: GroceryItem;
  isEditing: boolean;
  editingText: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEditing: (id: string, text: string) => void;
  onChangeEditingText: (text: string) => void;
  onSaveEdit: (id: string, newText: string) => void;
  onCancelEdit: () => void;
  showDivider?: boolean;
}

export function GroceryItemRow({
  item,
  isEditing,
  editingText,
  onToggle,
  onDelete,
  onStartEditing,
  onChangeEditingText,
  onSaveEdit,
  onCancelEdit,
  showDivider = true,
}: GroceryItemRowProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isEditing) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (!editingText.trim()) {
      onCancelEdit();
    } else {
      onSaveEdit(item.id, editingText);
    }
  };

  const handleSubmit = () => {
    onSaveEdit(item.id, editingText);
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => onDelete(item.id)}
      testID={`delete-${item.id}`}
    >
      <Trash2 size={20} color="white" />
    </TouchableOpacity>
  );

  return (
    <View>
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        enabled={!isEditing}
      >
        <View style={styles.itemContainer}>
          <TouchableOpacity
            style={styles.itemCheckbox}
            onPress={() => onToggle(item.id)}
            testID={`toggle-${item.id}`}
            disabled={isEditing}
          >
            {item.checked ? (
              <CheckSquare size={24} color={theme.colors.primary[500]} />
            ) : (
              <Square size={24} color={theme.colors.neutral[400]} />
            )}
          </TouchableOpacity>

          {isEditing ? (
            <TextInput
              ref={inputRef}
              style={styles.itemInput}
              value={editingText}
              onChangeText={onChangeEditingText}
              onSubmitEditing={handleSubmit}
              onBlur={handleBlur}
              returnKeyType="done"
              autoCapitalize="sentences"
              testID={`edit-input-${item.id}`}
            />
          ) : (
            <TouchableOpacity
              style={styles.textContainer}
              onPress={() => onStartEditing(item.id, item.text)}
              testID={`text-${item.id}`}
            >
              <Text
                style={[styles.itemText, item.checked && styles.itemTextChecked]}
                numberOfLines={2}
              >
                {item.text}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Swipeable>
      {showDivider && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  itemCheckbox: {
    padding: theme.spacing.xs,
  },
  textContainer: {
    flex: 1,
  },
  itemText: {
    ...typography.body,
    color: theme.colors.neutral[800],
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: theme.colors.neutral[500],
  },
  itemInput: {
    flex: 1,
    ...typography.body,
    fontSize: 16,
    color: theme.colors.neutral[800],
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
});