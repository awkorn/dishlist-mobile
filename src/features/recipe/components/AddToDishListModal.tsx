import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Check, Crown, Handshake } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import Modal from '@components/ui/Modal';
import { queryKeys } from '@lib/queryKeys';
import { dishlistService } from '@features/dishlist/services';
import { recipeService } from '../services';
import { useAddRecipeToDishList } from '../hooks';
import type { DishList } from '@features/dishlist/types';

interface AddToDishListModalProps {
  visible: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
}

export default function AddToDishListModal({
  visible,
  onClose,
  recipeId,
  recipeTitle,
}: AddToDishListModalProps) {
  // Fetch user's owned/collaborated dishlists
  const { data: allDishLists = [], isLoading: loadingDishLists } = useQuery({
    queryKey: queryKeys.dishLists.list('all'),
    queryFn: () => dishlistService.getDishLists('all'),
    enabled: visible,
  });

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
      >
        <View style={styles.dishListInfo}>
          <View style={styles.dishListHeader}>
            <Text
              style={[
                styles.dishListTitle,
                alreadyAdded && styles.dishListTitleDisabled,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View style={styles.badges}>
              {item.isOwner && <Crown size={14} color={theme.colors.warning} />}
              {item.isCollaborator && <Handshake size={14} color={theme.colors.success} />}
            </View>
          </View>
          <Text style={styles.dishListMeta}>
            {item.recipeCount} {item.recipeCount === 1 ? 'recipe' : 'recipes'}
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
    <Modal visible={visible} onClose={onClose} title="Add to DishList">
      <View style={styles.container}>
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
    ...typography.heading3,
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
  dishListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  dishListItemDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.neutral[50],
  },
  dishListInfo: {
    flex: 1,
  },
  dishListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  dishListTitle: {
    ...typography.subtitle,
    fontSize: 16,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  dishListTitleDisabled: {
    color: theme.colors.neutral[500],
  },
  badges: {
    flexDirection: 'row',
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