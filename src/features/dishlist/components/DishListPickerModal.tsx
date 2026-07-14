import React, { type ReactNode, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Check, Crown, Handshake } from "lucide-react-native";
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
  const isLoading = loadingDishLists || loading;

  const renderDishList = ({ item }: { item: DishList }) => {
    const alreadySelected = alreadySelectedIds.has(item.id);
    const role = item.isOwner ? "Owner" : "Collaborator";

    return (
      <TouchableOpacity
        style={[
          styles.dishListItem,
          alreadySelected && styles.dishListItemDisabled,
        ]}
        onPress={() => onSelect(item.id)}
        disabled={alreadySelected || isSelecting}
        accessibilityRole="button"
        accessibilityState={{ disabled: alreadySelected || isSelecting }}
        accessibilityLabel={
          alreadySelected
            ? `${item.title}, already added`
            : `Select ${item.title}, ${role}`
        }
        accessibilityHint={
          alreadySelected ? undefined : "Selects this DishList"
        }
        activeOpacity={0.7}
      >
        <View style={styles.dishListInfo}>
          <View style={styles.dishListHeader}>
            <Text style={styles.dishListTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.badges}>
              {item.isOwner && (
                <Crown size={14} color={theme.colors.warning} />
              )}
              {item.isCollaborator && (
                <Handshake size={14} color={theme.colors.success} />
              )}
            </View>
          </View>
          <Text style={styles.dishListMeta}>
            {item.recipeCount} {item.recipeCount === 1 ? "recipe" : "recipes"}
          </Text>
        </View>

        {alreadySelected && (
          <View style={styles.checkContainer}>
            <Check size={20} color={theme.colors.success} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} onClose={onClose} title={title}>
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
    padding: theme.spacing.xl,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
  },
  dishListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  dishListItemDisabled: {
    opacity: 0.5,
  },
  dishListInfo: {
    flex: 1,
  },
  dishListHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  dishListTitle: {
    ...typography.subtitle,
    fontSize: 16,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  dishListMeta: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
  checkContainer: {
    marginLeft: theme.spacing.md,
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
