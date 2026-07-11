import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import Modal from '@components/ui/Modal';
import { useDishLists } from '@features/dishlist/hooks';
import { recipeService } from '../services';
import { useAddRecipeToDishList } from '../hooks';
import type { DishList } from '@features/dishlist/types';

interface AddToDishListModalProps {
  visible: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
  createsCopy: boolean;
}

export default function AddToDishListModal({
  visible,
  onClose,
  recipeId,
  recipeTitle,
  createsCopy,
}: AddToDishListModalProps) {
  // Fetch user's owned/collaborated dishlists (paginated)
  const {
    dishLists: allDishLists,
    isLoading: loadingDishLists,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useDishLists({ tab: 'all', enabled: visible });

  // Fetch which dishlists already contain this recipe
  const { data: existingDishListIds = [], isLoading: loadingExisting } = useQuery({
    queryKey: ['recipe', recipeId, 'dishlists'],
    queryFn: () => recipeService.getRecipeDishLists(recipeId),
    enabled: visible,
  });

  // Filter to only owned/collaborated dishlists
  const eligibleDishLists = useMemo(() => {
    return allDishLists.filter(
      (list: DishList) => list.isOwner || list.isCollaborator
    );
  }, [allDishLists]);

  // Add recipe mutation
  const addMutation = useAddRecipeToDishList();

  const handleSelectDishList = (dishListId: string) => {
    addMutation.mutate(
      { dishListId, recipeId },
      { onSuccess: () => onClose() }
    );
  };

  const isLoading = loadingDishLists || loadingExisting;

  const renderDishList = ({ item }: { item: DishList }) => {
    const alreadyAdded = existingDishListIds.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.dishListItem,
          alreadyAdded && styles.dishListItemDisabled,
        ]}
        onPress={() => !alreadyAdded && handleSelectDishList(item.id)}
        disabled={alreadyAdded || addMutation.isPending}
        accessibilityRole="button"
        accessibilityState={{ disabled: alreadyAdded }}
        accessibilityLabel={
          alreadyAdded
            ? `${item.title}, already added`
            : `Add to ${item.title}, ${item.isOwner ? 'Owner' : 'Collaborator'}`
        }
        accessibilityHint={alreadyAdded ? undefined : 'Adds this recipe to the DishList'}
        activeOpacity={0.7}
      >
        <View style={styles.dishListInfo}>
          <Text
            style={[
              styles.dishListTitle,
              alreadyAdded && styles.dishListTitleDisabled,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.dishListMeta}>
            {item.recipeCount} {item.recipeCount === 1 ? 'recipe' : 'recipes'}
          </Text>
        </View>

        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>
            {item.isOwner ? 'Owner' : 'Collaborator'}
          </Text>
        </View>

        {alreadyAdded && (
          <View style={styles.checkContainer}>
            <Check size={20} color={theme.colors.success} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={createsCopy ? "Save to DishList" : "Add to DishList"}
    >
      <View style={styles.container}>
        {createsCopy && (
          <Text style={styles.copyNotice}>
            Saving “{recipeTitle}” creates your own copy. Future changes to the
            original won’t affect it.
          </Text>
        )}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text style={styles.loadingText}>Loading your DishLists...</Text>
          </View>
        ) : eligibleDishLists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No DishLists Available</Text>
            <Text style={styles.emptyText}>
              Create a DishList first to add recipes to it.
            </Text>
          </View>
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

        {addMutation.isError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {(addMutation.error as any)?.response?.data?.error ||
                'Failed to add recipe. Please try again.'}
            </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  copyNotice: {
    ...typography.caption,
    color: theme.colors.neutral[600],
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    lineHeight: 18,
  },
  loadingText: {
    ...typography.body,
    color: theme.colors.neutral[600],
    marginTop: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['4xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: theme.colors.neutral[800],
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: 'center',
  },
  listContent: {
    padding: theme.spacing.xl,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
  },
  dishListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.infoTile,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.infoTile,
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
  dishListTitleDisabled: {
    color: theme.colors.neutral[500],
  },
  roleContainer: {
    minHeight: 44,
    justifyContent: 'center',
    marginLeft: theme.spacing.lg,
  },
  roleLabel: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    flexShrink: 0,
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
    backgroundColor: '#FEF2F2',
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.xl,
  },
  errorText: {
    ...typography.caption,
    color: '#991B1B',
    textAlign: 'center',
  },
});
