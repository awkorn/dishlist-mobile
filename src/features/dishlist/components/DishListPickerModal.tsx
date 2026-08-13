import React, { type ReactNode, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Check } from "lucide-react-native";
import { EmptyState } from "@components/ui";
import Modal from "@components/ui/Modal";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { useDishLists } from "../hooks";
import type { DishList } from "../types";

const EMPTY_DISH_LIST_IDS: readonly string[] = [];

interface DishListPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dishListId: string) => void;
  title: string;
  alreadySelectedDishListIds?: readonly string[];
  selectedDishListIds?: readonly string[];
  selectionMode?: "single" | "multiple";
  onDone?: () => void;
  isSelecting?: boolean;
  loading?: boolean;
  notice?: ReactNode;
  emptyMessage?: string;
  errorMessage?: string;
  selectingMessage?: string;
}

export function DishListPickerModal({
  visible,
  onClose,
  onSelect,
  title,
  alreadySelectedDishListIds = EMPTY_DISH_LIST_IDS,
  selectedDishListIds = EMPTY_DISH_LIST_IDS,
  selectionMode = "single",
  onDone,
  isSelecting = false,
  loading = false,
  notice,
  emptyMessage = "Create a DishList first to save recipes to it.",
  errorMessage,
  selectingMessage,
}: DishListPickerModalProps) {
  const {
    dishLists: allDishLists,
    isLoading: loadingDishLists,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useDishLists({ tab: "all", enabled: visible });

  const eligibleDishLists = useMemo(
    () =>
      allDishLists.filter(
        (dishList) => dishList.isOwner || dishList.isCollaborator,
      ),
    [allDishLists],
  );
  const alreadySelectedIds = useMemo(
    () => new Set(alreadySelectedDishListIds),
    [alreadySelectedDishListIds],
  );
  const selectedIds = useMemo(
    () => new Set(selectedDishListIds),
    [selectedDishListIds],
  );
  const isLoading = loadingDishLists || loading;
  const isMultipleSelection = selectionMode === "multiple";

  const renderDishList = ({ item }: { item: DishList }) => {
    const alreadySelected = alreadySelectedIds.has(item.id);
    const selected = alreadySelected || selectedIds.has(item.id);
    const disabled = alreadySelected || isSelecting;
    const accessibilityLabel = alreadySelected
      ? `${item.title}, already added`
      : isMultipleSelection
        ? `${item.title}, ${selected ? "selected" : "not selected"}`
        : `Select ${item.title}`;

    return (
      <TouchableOpacity
        style={[
          styles.dishListItem,
          alreadySelected && styles.dishListItemDisabled,
        ]}
        onPress={() => onSelect(item.id)}
        disabled={disabled}
        accessibilityRole={isMultipleSelection ? "checkbox" : "button"}
        accessibilityState={
          isMultipleSelection
            ? { checked: selected, disabled }
            : { disabled }
        }
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={
          alreadySelected
            ? undefined
            : isMultipleSelection
              ? "Toggles this DishList selection"
              : "Selects this DishList"
        }
        activeOpacity={0.7}
      >
        <View style={styles.dishListInfo}>
          <Text style={styles.dishListTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.dishListMeta}>
            {item.recipeCount} {item.recipeCount === 1 ? "recipe" : "recipes"}
          </Text>
        </View>

        {(isMultipleSelection || alreadySelected) && (
          <View
            style={[
              styles.selectionControl,
              selected && styles.selectionControlSelected,
            ]}
          >
            {selected && (
              <Check
                size={14}
                color={theme.colors.onPrimary}
                strokeWidth={3}
              />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      closeButtonDisabled={isSelecting}
      rightAction={
        isMultipleSelection && onDone ? (
          <TouchableOpacity
            onPress={onDone}
            disabled={selectedDishListIds.length === 0 || isSelecting}
            style={styles.doneButton}
            accessibilityRole="button"
            accessibilityLabel="Done selecting DishLists"
            accessibilityState={{
              disabled: selectedDishListIds.length === 0 || isSelecting,
              busy: isSelecting,
            }}
          >
            <Text
              style={[
                styles.doneButtonText,
                (selectedDishListIds.length === 0 || isSelecting) &&
                  styles.doneButtonTextDisabled,
              ]}
            >
              {isSelecting ? "Saving" : "Done"}
            </Text>
          </TouchableOpacity>
        ) : undefined
      }
    >
      <View style={styles.container}>
        {notice && <View style={styles.notice}>{notice}</View>}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.loadingText}>Loading your DishLists...</Text>
          </View>
        ) : eligibleDishLists.length === 0 ? (
          <EmptyState
            title="No DishLists Available"
            message={emptyMessage}
          />
        ) : (
          <FlatList
            data={eligibleDishLists}
            renderItem={renderDishList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                void fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary[500]}
                  style={styles.footerLoader}
                />
              ) : null
            }
          />
        )}

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {isSelecting && selectingMessage && (
          <View style={styles.selectingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.selectingText}>{selectingMessage}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notice: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing["4xl"],
  },
  loadingText: {
    ...typography.body,
    color: theme.colors.neutral[600],
    marginTop: theme.spacing.lg,
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing["2xl"],
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
  },
  dishListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    minHeight: 72,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.neutral[200],
  },
  dishListItemDisabled: {
    opacity: 0.5,
  },
  dishListInfo: {
    flex: 1,
  },
  dishListTitle: {
    ...typography.subtitle,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  dishListMeta: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
  selectionControl: {
    width: 24,
    height: 24,
    marginLeft: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.neutral[400],
    alignItems: "center",
    justifyContent: "center",
  },
  selectionControlSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  doneButton: {
    minHeight: 44,
    minWidth: 44,
    marginRight: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    ...typography.button,
    color: theme.colors.primary[500],
  },
  doneButtonTextDisabled: {
    color: theme.colors.neutral[400],
  },
  errorContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.xl,
  },
  errorText: {
    ...typography.caption,
    color: theme.colors.errorText,
    textAlign: "center",
  },
  selectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  selectingText: {
    ...typography.body,
    color: theme.colors.neutral[600],
    marginTop: theme.spacing.lg,
  },
});
