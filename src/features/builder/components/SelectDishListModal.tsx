import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Crown, Handshake } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import Modal from "@components/ui/Modal";
import { EmptyState } from "@components/ui";
import { useDishLists } from "@features/dishlist/hooks";
import type { DishList } from "@features/dishlist/types";

interface SelectDishListModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dishListId: string) => void;
  saving?: boolean;
}

export function SelectDishListModal({
  visible,
  onClose,
  onSelect,
  saving,
}: SelectDishListModalProps) {
  const {
    dishLists: allDishLists,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useDishLists({ tab: "all", enabled: visible });

  const eligibleDishLists = useMemo(() => {
    return allDishLists.filter(
      (list: DishList) => list.isOwner || list.isCollaborator
    );
  }, [allDishLists]);

  const renderDishList = ({ item }: { item: DishList }) => (
    <TouchableOpacity
      style={styles.dishListItem}
      onPress={() => onSelect(item.id)}
      disabled={saving}
    >
      <View style={styles.dishListInfo}>
        <View style={styles.dishListHeader}>
          <Text style={styles.dishListTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.badges}>
            {item.isOwner && <Crown size={14} color={theme.colors.warning} />}
            {item.isCollaborator && (
              <Handshake size={14} color={theme.colors.success} />
            )}
          </View>
        </View>
        <Text style={styles.dishListMeta}>
          {item.recipeCount} {item.recipeCount === 1 ? "recipe" : "recipes"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} onClose={onClose} title="Save to DishList">
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.loadingText}>Loading your DishLists...</Text>
          </View>
        ) : eligibleDishLists.length === 0 ? (
          <EmptyState
            title="No DishLists Available"
            message="Create a DishList first to save recipes to it."
          />
        ) : (
          <FlatList
            data={eligibleDishLists}
            renderItem={renderDishList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
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

        {saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.savingText}>Saving recipe...</Text>
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
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  savingText: {
    ...typography.body,
    color: theme.colors.neutral[600],
    marginTop: theme.spacing.lg,
  },
});
