import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { CheckSquare, Square, Trash2 } from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import type { GroceryItem } from '../types';

interface GroceryItemRowProps {
  item: GroceryItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  showDivider?: boolean;
}

export function GroceryItemRow({
  item,
  onToggle,
  onDelete,
  showDivider = true,
}: GroceryItemRowProps) {
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
      >
        <View style={styles.itemContainer}>
          <TouchableOpacity
            style={styles.itemCheckbox}
            onPress={() => onToggle(item.id)}
            testID={`toggle-${item.id}`}
          >
            {item.checked ? (
              <CheckSquare size={24} color={theme.colors.primary[500]} />
            ) : (
              <Square size={24} color={theme.colors.neutral[400]} />
            )}
          </TouchableOpacity>
          <Text
            style={[styles.itemText, item.checked && styles.itemTextChecked]}
            numberOfLines={2}
          >
            {item.text}
          </Text>
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
  itemText: {
    ...typography.body,
    color: theme.colors.neutral[800],
    flex: 1,
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: theme.colors.neutral[500],
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