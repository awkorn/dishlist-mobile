import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';
import { X, GripVertical } from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import type { RecipeItem } from '../types';

interface DraggableRecipeListProps {
  items: RecipeItem[];
  onItemsChange: (items: RecipeItem[]) => void;
  type: 'ingredients' | 'instructions';
  error?: string;
}

interface ItemWithId extends RecipeItem {
  id: string;
}

export default function DraggableRecipeList({
  items,
  onItemsChange,
  type,
  error,
}: DraggableRecipeListProps) {
  // Add unique IDs for drag tracking
  const itemsWithIds: ItemWithId[] = items.map((item, index) => ({
    ...item,
    id: `${type}-${index}-${item.type}`,
  }));

  const updateItem = useCallback(
    (index: number, text: string) => {
      const updated = [...items];
      updated[index] = { ...updated[index], text };
      onItemsChange(updated);
    },
    [items, onItemsChange]
  );

  const removeItem = useCallback(
    (index: number) => {
      if (items.length > 1) {
        const updated = items.filter((_, i) => i !== index);
        onItemsChange(updated);
      }
    },
    [items, onItemsChange]
  );

  const addItem = useCallback(() => {
    onItemsChange([...items, { type: 'item', text: '' }]);
  }, [items, onItemsChange]);

  const addSubsection = useCallback(() => {
    // Add header followed by an empty item
    onItemsChange([
      ...items,
      { type: 'header', text: '' },
      { type: 'item', text: '' },
    ]);
  }, [items, onItemsChange]);

  const handleDragEnd = useCallback(
    ({ data }: { data: ItemWithId[] }) => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      // Strip IDs before updating
      const updatedItems: RecipeItem[] = data.map(({ type, text }) => ({
        type,
        text,
      }));
      onItemsChange(updatedItems);
    },
    [onItemsChange]
  );

  const handleDragBegin = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  // Get step number for items (excluding headers)
  const getItemNumber = useCallback(
    (index: number): number => {
      let count = 0;
      for (let i = 0; i <= index; i++) {
        if (items[i]?.type === 'item') {
          count++;
        }
      }
      return count;
    },
    [items]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<ItemWithId>) => {
      const index = getIndex() ?? 0;
      const isHeader = item.type === 'header';
      const itemNumber = isHeader ? 0 : getItemNumber(index);

      const placeholder = isHeader
        ? 'Subsection title (e.g., "For the Sauce")'
        : type === 'ingredients'
        ? `Ingredient ${itemNumber}`
        : `Step ${itemNumber}`;

      return (
        <ScaleDecorator>
          <View
            style={[
              styles.itemRow,
              isActive && styles.itemRowActive,
              isHeader && styles.headerRow,
            ]}
          >
            {/* Drag Handle */}
            <TouchableOpacity
              onLongPress={drag}
              delayLongPress={150}
              style={styles.dragHandle}
            >
              <GripVertical
                size={20}
                color={
                  isActive
                    ? theme.colors.primary[500]
                    : theme.colors.neutral[400]
                }
              />
            </TouchableOpacity>

            {/* Input */}
            <TextInput
              style={[
                styles.input,
                isHeader && styles.headerInput,
                type === 'instructions' && !isHeader && styles.instructionInput,
              ]}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.neutral[400]}
              value={item.text}
              onChangeText={(text) => updateItem(index, text)}
              multiline={type === 'instructions' && !isHeader}
            />

            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeItem(index)}
            >
              <X size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </ScaleDecorator>
      );
    },
    [type, updateItem, removeItem, getItemNumber]
  );

  const sectionTitle = type === 'ingredients' ? 'Ingredients' : 'Instructions';
  const addButtonText = type === 'ingredients' ? 'Add Ingredient' : 'Add Step';

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        <TouchableOpacity onPress={addSubsection}>
          <Text style={styles.addSubsectionText}>Add Subsection</Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Draggable List */}
      <DraggableFlatList
        data={itemsWithIds}
        onDragEnd={handleDragEnd}
        onDragBegin={handleDragBegin}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
        containerStyle={styles.listContainer}
      />

      {/* Add Item Button */}
      <TouchableOpacity style={styles.addButton} onPress={addItem}>
        <Text style={styles.addButtonText}>{addButtonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing['3xl'],
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
  },
  addSubsectionText: {
    ...typography.button,
    color: theme.colors.primary[500],
    fontSize: 14,
  },
  errorText: {
    ...typography.caption,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  listContainer: {
    marginBottom: theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  itemRowActive: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  headerRow: {
    marginTop: theme.spacing.md,
  },
  dragHandle: {
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    ...typography.body,
    flex: 1,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  headerInput: {
    borderStyle: 'dashed',
    borderColor: theme.colors.primary[500],
    borderWidth: 1.5,
    fontWeight: '600',
  },
  instructionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  removeButton: {
    padding: theme.spacing.sm,
  },
  addButton: {
    alignItems: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.md,
    borderStyle: 'dashed',
  },
  addButtonText: {
    ...typography.button,
    color: theme.colors.primary[500],
  },
});