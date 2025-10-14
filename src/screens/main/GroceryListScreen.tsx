import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2, Plus, CheckSquare, Square } from "lucide-react-native";
import { Swipeable } from "react-native-gesture-handler";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";
import { groceryStorage, GroceryItem } from "../../services/groceryStorage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function GroceryListScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const loaded = await groceryStorage.loadItems();
    setItems(loaded);
  };

  const handleToggleCheck = async (id: string) => {
    await groceryStorage.toggleCheck(id);
    loadItems();
  };

  const handleDelete = async (id: string) => {
    await groceryStorage.deleteItem(id);
    loadItems();
  };

  const handleAddItem = async () => {
    const text = newItemText.trim();
    if (!text) {
      setIsAdding(false);
      return;
    }
    await groceryStorage.addItems([text]);
    setNewItemText("");
    setIsAdding(false);
    loadItems();
  };

  const handleClearChecked = () => {
    const checkedCount = items.filter((i) => i.checked).length;
    if (checkedCount === 0) {
      Alert.alert("No Items", "There are no checked items to clear.");
      return;
    }
    Alert.alert(
      "Clear Checked Items",
      `Remove ${checkedCount} checked ${
        checkedCount === 1 ? "item" : "items"
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await groceryStorage.clearChecked();
            loadItems();
          },
        },
      ]
    );
  };

  const handleCheckAll = async () => {
    const allChecked = items.every((i) => i.checked);
    if (allChecked) {
      await groceryStorage.uncheckAll();
    } else {
      await groceryStorage.checkAll();
    }
    loadItems();
  };

  const renderRightActions = (id: string) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => handleDelete(id)}
    >
      <Trash2 size={20} color="white" />
    </TouchableOpacity>
  );

  const allChecked = items.length > 0 && items.every((i) => i.checked);

  return (
    <View style={styles.container}>
      {/* Header - extends to top of screen */}
      <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Grocery List</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleCheckAll}
              disabled={items.length === 0}
            >
              <Text
                style={[
                  styles.headerButtonText,
                  items.length === 0 && styles.disabledText,
                ]}
              >
                {allChecked ? "Uncheck All" : "Check All"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClearChecked}
            >
              <Text style={styles.headerButtonText}>Clear Checked</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {items.length === 0 && !isAdding && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Your grocery list is empty</Text>
            <Text style={styles.emptyText}>
              Add items from recipes or tap "Add Item" below
            </Text>
          </View>
        )}

        {items.map((item, index) => (
          <View key={item.id}>
            <Swipeable
              renderRightActions={() => renderRightActions(item.id)}
              overshootRight={false}
            >
              <View style={styles.itemContainer}>
                <TouchableOpacity
                  style={styles.itemCheckbox}
                  onPress={() => handleToggleCheck(item.id)}
                >
                  {item.checked ? (
                    <CheckSquare size={24} color={theme.colors.primary[500]} />
                  ) : (
                    <Square size={24} color={theme.colors.neutral[400]} />
                  )}
                </TouchableOpacity>
                <Text
                  style={[
                    styles.itemText,
                    item.checked && styles.itemTextChecked,
                  ]}
                  numberOfLines={2}
                >
                  {item.text}
                </Text>
              </View>
            </Swipeable>
            {index < items.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        {/* Inline Add Row */}
        {isAdding && (
          <View style={styles.addingRow}>
            <View style={styles.itemCheckbox}>
              <Square size={24} color={theme.colors.neutral[300]} />
            </View>
            <TextInput
              ref={inputRef}
              style={styles.addInput}
              placeholder="Enter item..."
              placeholderTextColor={theme.colors.neutral[400]}
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={handleAddItem}
              onBlur={handleAddItem}
              returnKeyType="done"
              autoFocus
            />
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[{ paddingBottom: 80 + insets.bottom }]}>
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setIsAdding(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            disabled={isAdding}
          >
            <Plus size={20} color={theme.colors.primary[500]} />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerSafeArea: {
    backgroundColor: theme.colors.surface,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.surface,
  },
  title: {
    ...typography.heading2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  headerButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  headerButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerButtonText: {
    ...typography.button,
    fontSize: 14,
    color: theme.colors.primary[500],
  },
  disabledText: {
    color: theme.colors.neutral[400],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    paddingHorizontal: theme.spacing["4xl"],
    paddingVertical: theme.spacing["4xl"],
    alignItems: "center",
  },
  emptyTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
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
    textDecorationLine: "line-through",
    color: theme.colors.neutral[500],
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
    marginHorizontal: theme.spacing.xl,
  },
  addingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.md,
  },
  addInput: {
    ...typography.body,
    flex: 1,
    padding: 0,
    color: theme.colors.neutral[800],
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
    borderStyle: "dashed",
    backgroundColor: theme.colors.surface,
  },
  addButtonText: {
    ...typography.button,
    color: theme.colors.primary[500],
  },
});
