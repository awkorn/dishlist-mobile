import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { useGroceryList } from "../hooks/useGroceryList";
import {
  GroceryItemRow,
  GroceryEmptyState,
  GroceryInputRow,
} from "../components";

export default function GroceryListScreen() {
  const insets = useSafeAreaInsets();
  const {
    items,
    isLoading,
    isAddingItem,
    editingText,
    editingItemId,
    allChecked,
    checkedCount,
    setIsAddingItem,
    setEditingText,
    toggleCheck,
    deleteItem,
    saveCurrentItem,
    startEditing,
    cancelEditing,
    saveEditedItem,
    handleClearChecked,
    handleToggleAll,
  } = useGroceryList();

  const handleStartAdding = async () => {
    // Cancel any item editing first
    if (editingItemId) {
      cancelEditing();
    }

    if (isAddingItem && editingText.trim()) {
      await saveCurrentItem();
    }
    setIsAddingItem(true);
    setEditingText("");
  };

  const handleDoneEditing = async () => {
    await saveCurrentItem();
    setIsAddingItem(false);
  };

  const handleBlur = () => {
    if (!editingText.trim()) {
      setIsAddingItem(false);
    }
  };

  const handleStartItemEditing = (id: string, text: string) => {
    // Close add row if open
    if (isAddingItem) {
      setIsAddingItem(false);
    }
    startEditing(id, text);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FFFFFF", "#F4F2EE"]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingTop: insets.top }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Grocery List</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleToggleAll}
              disabled={items.length === 0}
              testID="toggle-all-button"
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

            {checkedCount === 0 ? null : (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleClearChecked}
                testID="clear-checked-button"
              >
                <Text style={styles.headerButtonText}>Clear Checked</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleStartAdding}
              testID="add-item-button"
            >
              <Plus size={20} color={theme.colors.primary[500]} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {items.length === 0 && !isAddingItem && <GroceryEmptyState />}

        {isAddingItem && (
          <>
            <GroceryInputRow
              value={editingText}
              onChangeText={setEditingText}
              onSubmit={handleDoneEditing}
              onBlur={handleBlur}
              isFirst={true}
              isLast={items.length === 0}
            />
            {items.length > 0 && <View style={styles.divider} />}
          </>
        )}

        {items.map((item, index) => (
          <GroceryItemRow
            key={item.id}
            item={item}
            isEditing={editingItemId === item.id}
            editingText={editingItemId === item.id ? editingText : ""}
            onToggle={toggleCheck}
            onDelete={deleteItem}
            onStartEditing={handleStartItemEditing}
            onChangeEditingText={setEditingText}
            onSaveEdit={saveEditedItem}
            onCancelEdit={cancelEditing}
            showDivider={index < items.length - 1}
            isFirst={index === 0 && !isAddingItem}
            isLast={index === items.length - 1}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  headerButton: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  headerButtonText: {
    ...typography.button,
    fontSize: 16,
    color: theme.colors.primary[500],
  },
  disabledText: {
    color: theme.colors.neutral[400],
  },
  addButton: {
    padding: theme.spacing.sm,
    marginLeft: "auto",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
  },
});
