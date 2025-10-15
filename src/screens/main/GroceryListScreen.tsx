import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Trash2, CheckSquare, Square, Plus } from "lucide-react-native";
import { Swipeable } from "react-native-gesture-handler";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";
import { groceryStorage, GroceryItem } from "../../services/groceryStorage";

export default function GroceryListScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<GroceryItem[]>([]);
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
    if (!text) return;
    await groceryStorage.addItems([text]);
    setNewItemText("");
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      {/* Header */}
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

      {/* List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Your grocery list is empty</Text>
            <Text style={styles.emptyText}>
              Add items from recipes or below
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
      </ScrollView>

      {/* Add Bar */}
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.addBar, { paddingBottom: insets.bottom || 16 }]}
      >
        <View style={styles.addRow}>
          <TextInput
            ref={inputRef}
            style={styles.addInput}
            placeholder="Add an item..."
            placeholderTextColor={theme.colors.neutral[400]}
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Plus size={22} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  deleteButton: {
    backgroundColor: theme.colors.error,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  addBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    paddingHorizontal: theme.spacing.xl,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  addInput: {
    flex: 1,
    ...typography.body,
    color: theme.colors.neutral[800],
    paddingVertical: 8,
  },
  addButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
