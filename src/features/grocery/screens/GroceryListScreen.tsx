import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import InlineError from "@components/ui/InlineError";
import { ScreenHeader, ScreenHeaderAction } from "@components/ui";

export default function GroceryListScreen() {
  const insets = useSafeAreaInsets();
  const {
    items,
    isLoading,
    isError,
    isFetching,
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
    refresh,
  } = useGroceryList();

  const handleStartAdding = async () => {
    // Cancel any item editing first
    if (editingItemId) {
      cancelEditing();
    }

    if (isAddingItem && editingText.trim()) {
      const didSave = await saveCurrentItem();
      if (!didSave) return;
    }
    setIsAddingItem(true);
    setEditingText("");
  };

  const handleDoneEditing = async () => {
    const didSave = await saveCurrentItem();
    if (didSave) {
      setIsAddingItem(false);
    }
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

  if (isError) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.colors.surface, theme.colors.background]}
          locations={[0, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ paddingTop: insets.top }}
        >
          <ScreenHeader
            title="Grocery List"
            style={styles.header}
            titleStyle={styles.title}
          />
        </LinearGradient>

        <View style={styles.errorContainer}>
          <InlineError
            message="We couldn't load your grocery list. Your saved items have not been changed."
            action={isFetching ? undefined : "Try Again"}
            onActionPress={isFetching ? undefined : () => void refresh()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.surface, theme.colors.background]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ paddingTop: insets.top }}
      >
        <ScreenHeader
          title="Grocery List"
          style={styles.header}
          titleStyle={styles.title}
        />
        <View style={styles.headerButtons}>
          <ScreenHeaderAction
            style={styles.headerButton}
            onPress={handleToggleAll}
            disabled={items.length === 0}
            testID="toggle-all-button"
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.headerButtonText,
                items.length === 0 && styles.disabledText,
              ]}
            >
              {allChecked ? "Uncheck All" : "Check All"}
            </Text>
          </ScreenHeaderAction>

          {checkedCount === 0 ? null : (
            <ScreenHeaderAction
              style={styles.headerButton}
              onPress={handleClearChecked}
              testID="clear-checked-button"
              accessibilityRole="button"
            >
              <Text style={styles.headerButtonText}>Clear Checked</Text>
            </ScreenHeaderAction>
          )}

          <ScreenHeaderAction
            style={styles.addButton}
            onPress={handleStartAdding}
            testID="add-item-button"
            accessibilityRole="button"
            accessibilityLabel="Add grocery item"
          >
            <Plus size={20} color={theme.colors.primary[500]} />
          </ScreenHeaderAction>
        </View>
      </LinearGradient>

      <FlatList
        testID="grocery-list"
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <GroceryItemRow
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
        )}
        ListHeaderComponent={
          isAddingItem ? (
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
          ) : null
        }
        ListEmptyComponent={isAddingItem ? null : <GroceryEmptyState />}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
      />
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
  errorContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  header: {
    backgroundColor: "transparent",
  },
  title: {
    ...typography.heading4,
    color: theme.colors.textPrimary,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
  },
});
