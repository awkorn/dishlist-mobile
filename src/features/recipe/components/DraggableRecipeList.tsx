import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';
import { X, GripVertical, Check, ArrowDownUp } from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import type { RecipeItem } from '../types';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DraggableRecipeListProps {
  items: RecipeItem[];
  onItemsChange: (items: RecipeItem[]) => void;
  type: 'ingredients' | 'instructions';
  error?: string;
}

// Internal item type with stable ID
interface InternalItem extends RecipeItem {
  _id: string;
}

// Simple ID generator (avoids uuid dependency)
let idCounter = 0;
const generateId = (): string => {
  idCounter += 1;
  return `item_${Date.now()}_${idCounter}`;
};

// Custom spring animation config
const springAnimation = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.7,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

export default function DraggableRecipeList({
  items,
  onItemsChange,
  type,
  error,
}: DraggableRecipeListProps) {
  // ============================================
  // REORDER MODE STATE
  // ============================================
  const [isReorderMode, setIsReorderMode] = useState(false);

  const toggleReorderMode = useCallback(() => {
    // Trigger animation before state change
    LayoutAnimation.configureNext(springAnimation);
    
    if (!isReorderMode && Platform.OS === 'ios') {
      // Haptic feedback when entering reorder mode
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsReorderMode((prev) => !prev);
  }, [isReorderMode]);

  // ============================================
  // STABLE ID MANAGEMENT
  // ============================================
  const idMapRef = useRef<Map<number, string>>(new Map());
  const [internalItems, setInternalItems] = useState<InternalItem[]>([]);
  const isDraggingRef = useRef(false);

  // Sync external items to internal state (with stable IDs)
  useEffect(() => {
    if (isDraggingRef.current) return;

    const newInternalItems: InternalItem[] = items.map((item, index) => {
      let existingId = idMapRef.current.get(index);

      if (!existingId) {
        existingId = generateId();
        idMapRef.current.set(index, existingId);
      }

      return {
        ...item,
        _id: existingId,
      };
    });

    // Clean up old IDs for removed items
    if (items.length < idMapRef.current.size) {
      const keysToRemove: number[] = [];
      idMapRef.current.forEach((_, key) => {
        if (key >= items.length) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach((key) => idMapRef.current.delete(key));
    }

    setInternalItems(newInternalItems);
  }, [items]);

  // ============================================
  // ITEM OPERATIONS
  // ============================================
  const updateItem = useCallback(
    (id: string, text: string) => {
      setInternalItems((prev) =>
        prev.map((item) => (item._id === id ? { ...item, text } : item))
      );

      const index = internalItems.findIndex((item) => item._id === id);
      if (index !== -1) {
        const updated = [...items];
        updated[index] = { ...updated[index], text };
        onItemsChange(updated);
      }
    },
    [items, internalItems, onItemsChange]
  );

  const removeItem = useCallback(
    (id: string) => {
      if (items.length <= 1) return;

      // Animate the removal
      LayoutAnimation.configureNext(springAnimation);

      const index = internalItems.findIndex((item) => item._id === id);
      if (index !== -1) {
        for (let i = index; i < idMapRef.current.size; i++) {
          idMapRef.current.delete(i);
        }

        const updated = items.filter((_, i) => i !== index);
        onItemsChange(updated);
      }
    },
    [items, internalItems, onItemsChange]
  );

  const addItem = useCallback(() => {
    LayoutAnimation.configureNext(springAnimation);
    onItemsChange([...items, { type: 'item', text: '' }]);
  }, [items, onItemsChange]);

  const addSubsection = useCallback(() => {
    LayoutAnimation.configureNext(springAnimation);
    onItemsChange([
      ...items,
      { type: 'header', text: '' },
      { type: 'item', text: '' },
    ]);
  }, [items, onItemsChange]);

  // ============================================
  // DRAG HANDLERS
  // ============================================
  const handleDragBegin = useCallback(() => {
    isDraggingRef.current = true;
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const handleDragEnd = useCallback(
    ({ data }: { data: InternalItem[] }) => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setInternalItems(data);

      idMapRef.current.clear();
      data.forEach((item, index) => {
        idMapRef.current.set(index, item._id);
      });

      const updatedItems: RecipeItem[] = data.map(({ type, text }) => ({
        type,
        text,
      }));

      setTimeout(() => {
        isDraggingRef.current = false;
        onItemsChange(updatedItems);
      }, 0);
    },
    [onItemsChange]
  );

  // ============================================
  // ITEM NUMBER CALCULATION
  // ============================================
  const getItemNumber = useCallback(
    (index: number): number => {
      let count = 0;
      for (let i = 0; i <= index; i++) {
        if (internalItems[i]?.type === 'item') {
          count++;
        }
      }
      return count;
    },
    [internalItems]
  );

  // ============================================
  // RENDER ITEM
  // ============================================
  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<InternalItem>) => {
      const index = getIndex() ?? 0;
      const isHeader = item.type === 'header';
      const itemNumber = isHeader ? 0 : getItemNumber(index);

      const placeholder = isHeader
        ? 'Subsection title (e.g., "For the Sauce")'
        : type === 'ingredients'
        ? `Ingredient ${itemNumber}`
        : `Step ${itemNumber}`;

      return (
        <ScaleDecorator activeScale={1.03}>
          <View
            style={[
              styles.itemRow,
              isActive && styles.itemRowActive,
              isHeader && styles.headerRow,
              isReorderMode && styles.itemRowReorderMode,
            ]}
          >
            {/* Drag Handle - Only visible in reorder mode */}
            {isReorderMode && (
              <TouchableOpacity
                onLongPress={drag}
                delayLongPress={100}
                disabled={isActive}
                style={styles.dragHandle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            )}

            {/* Input */}
            <TextInput
              style={[
                styles.input,
                isHeader && styles.headerInput,
                type === 'instructions' && !isHeader && styles.instructionInput,
                isReorderMode && styles.inputReorderMode,
              ]}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.neutral[400]}
              value={item.text}
              onChangeText={(text) => updateItem(item._id, text)}
              multiline={type === 'instructions' && !isHeader}
              editable={!isActive && !isReorderMode}
            />

            {/* Remove Button - Hidden in reorder mode */}
            {!isReorderMode && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(item._id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </ScaleDecorator>
      );
    },
    [type, updateItem, removeItem, getItemNumber, isReorderMode]
  );

  // ============================================
  // RENDER
  // ============================================
  const sectionTitle = type === 'ingredients' ? 'Ingredients' : 'Instructions';
  const addButtonText = type === 'ingredients' ? 'Add Ingredient' : 'Add Step';

  // Memoize the list to prevent unnecessary re-renders
  const listComponent = useMemo(() => {
    if (isReorderMode) {
      return (
        <DraggableFlatList
          data={internalItems}
          onDragEnd={handleDragEnd}
          onDragBegin={handleDragBegin}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          scrollEnabled={false}
          containerStyle={styles.listContainer}
          activationDistance={5}
          dragItemOverflow={true}
        />
      );
    }

    // Non-reorder mode: simple static list (no drag functionality)
    return (
      <View style={styles.listContainer}>
        {internalItems.map((item, index) => {
          const isHeader = item.type === 'header';
          const itemNumber = isHeader ? 0 : getItemNumber(index);

          const placeholder = isHeader
            ? 'Subsection title (e.g., "For the Sauce")'
            : type === 'ingredients'
            ? `Ingredient ${itemNumber}`
            : `Step ${itemNumber}`;

          return (
            <View
              key={item._id}
              style={[styles.itemRow, isHeader && styles.headerRow]}
            >
              {/* Input */}
              <TextInput
                style={[
                  styles.input,
                  isHeader && styles.headerInput,
                  type === 'instructions' &&
                    !isHeader &&
                    styles.instructionInput,
                ]}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.neutral[400]}
                value={item.text}
                onChangeText={(text) => updateItem(item._id, text)}
                multiline={type === 'instructions' && !isHeader}
              />

              {/* Remove Button */}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(item._id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    );
  }, [
    isReorderMode,
    internalItems,
    handleDragEnd,
    handleDragBegin,
    renderItem,
    getItemNumber,
    type,
    updateItem,
    removeItem,
  ]);

  return (
    <View
      style={[styles.container, isReorderMode && styles.containerReorderMode]}
    >
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>

        <View style={styles.headerActions}>
          {/* Add Subsection - Hidden in reorder mode */}
          {!isReorderMode && (
            <TouchableOpacity
              onPress={addSubsection}
              style={styles.headerButton}
            >
              <Text style={styles.addSubsectionText}>Add Subsection</Text>
            </TouchableOpacity>
          )}

          {/* Reorder Toggle */}
          <TouchableOpacity
            onPress={toggleReorderMode}
            style={[
              styles.reorderButton,
              isReorderMode && styles.reorderButtonActive,
            ]}
          >
            {isReorderMode ? (
              <>
                <Check size={14} color={theme.colors.surface} />
                <Text style={styles.reorderButtonTextActive}>Done</Text>
              </>
            ) : (
              <>
                 <ArrowDownUp size={14} color={theme.colors.primary[500]} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Reorder Mode Hint */}
      {isReorderMode && (
        <Text style={styles.reorderHint}>
          Long press and drag items to reorder
        </Text>
      )}

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* List */}
      {listComponent}

      {/* Add Item Button - Hidden in reorder mode */}
      {!isReorderMode && (
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>{addButtonText}</Text>
        </TouchableOpacity>
      )}
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
  containerReorderMode: {
    backgroundColor: theme.colors.primary[50],
    borderWidth: 1,
    borderColor: theme.colors.secondary[50],
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[50]
  },
  addSubsectionText: {
    ...typography.button,
    color: theme.colors.primary[500],
    fontSize: 14,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[50],
  },
  reorderButtonActive: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  reorderButtonText: {
    ...typography.caption,
    color: theme.colors.primary[500],
    fontWeight: '600',
  },
  reorderButtonTextActive: {
    ...typography.caption,
    color: theme.colors.surface,
    fontWeight: '600',
  },
  reorderHint: {
    ...typography.caption,
    color: theme.colors.primary[600],
    textAlign: 'center',
    marginBottom: theme.spacing.md,
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
    borderRadius: theme.borderRadius.md,
  },
  itemRowReorderMode: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  itemRowActive: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderColor: theme.colors.primary[600],
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
  inputReorderMode: {
    backgroundColor: theme.colors.neutral[50],
    borderColor: theme.colors.neutral[300],
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