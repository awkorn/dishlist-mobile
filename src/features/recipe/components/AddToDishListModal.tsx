import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  DishListPickerModal,
  useRemoveRecipeFromDishList,
} from "@features/dishlist";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
import { toast } from "@components/ui/toast";
import { getErrorMessage } from "@utils";
import { useAddRecipeToDishList } from "../hooks";
import { recipeService } from "../services";

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
  const {
    data: existingDishListIds = [],
    isLoading: loadingExisting,
    isSuccess: loadedExisting,
  } = useQuery({
    queryKey: ["recipe", recipeId, "dishlists"],
    queryFn: () => recipeService.getRecipeDishLists(recipeId),
    enabled: visible,
  });
  const addMutation = useAddRecipeToDishList();
  const removeMutation = useRemoveRecipeFromDishList({
    showSuccessToast: false,
  });
  const [selectedDishListIds, setSelectedDishListIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const initializedForCurrentOpen = useRef(false);

  useEffect(() => {
    if (!visible) {
      initializedForCurrentOpen.current = false;
      return;
    }

    addMutation.reset();
    removeMutation.reset();
  }, [visible]);

  useEffect(() => {
    if (
      visible &&
      loadedExisting &&
      !initializedForCurrentOpen.current
    ) {
      setSelectedDishListIds(new Set(existingDishListIds));
      initializedForCurrentOpen.current = true;
    }
  }, [existingDishListIds, loadedExisting, visible]);

  const handleToggleDishList = useCallback((dishListId: string) => {
    setSelectedDishListIds((current) => {
      const next = new Set(current);
      if (next.has(dishListId)) {
        next.delete(dishListId);
      } else {
        next.add(dishListId);
      }
      return next;
    });
  }, []);

  const handleDone = useCallback(async () => {
    const selectedIds = Array.from(selectedDishListIds);
    if (selectedIds.length === 0 || isSaving) return;

    const existingIds = new Set(existingDishListIds);
    const idsToAdd = selectedIds.filter((id) => !existingIds.has(id));
    const idsToRemove = existingDishListIds.filter(
      (id) => !selectedDishListIds.has(id),
    );

    setIsSaving(true);
    try {
      // Add first so moving a recipe never leaves it without a DishList if a
      // later request fails. The API resolves a saved fork when removing an
      // externally-created recipe by its original ID.
      for (const dishListId of idsToAdd) {
        await addMutation.mutateAsync({ dishListId, recipeId });
      }
      for (const dishListId of idsToRemove) {
        await removeMutation.mutateAsync({ dishListId, recipeId });
      }

      if (idsToAdd.length > 0 || idsToRemove.length > 0) {
        toast.success(
          idsToRemove.length > 0
            ? "Recipe DishLists updated"
            : idsToAdd.length === 1
              ? createsCopy
                ? "Recipe saved to DishList"
                : "Recipe added to DishList"
              : createsCopy
                ? `Recipe saved to ${idsToAdd.length} DishLists`
                : `Recipe added to ${idsToAdd.length} DishLists`,
        );
      }
      onClose();
    } catch {
      // The mutation hook presents the API error and the picker stays open.
    } finally {
      setIsSaving(false);
    }
  }, [
    addMutation,
    createsCopy,
    existingDishListIds,
    isSaving,
    onClose,
    recipeId,
    removeMutation,
    selectedDishListIds,
  ]);

  return (
    <DishListPickerModal
      visible={visible}
      onClose={onClose}
      onSelect={handleToggleDishList}
      onDone={handleDone}
      title={createsCopy ? "Save to DishList" : "Add to DishList"}
      alreadySelectedDishListIds={existingDishListIds}
      selectedDishListIds={Array.from(selectedDishListIds)}
      selectionMode="multiple"
      isSelecting={isSaving}
      loading={loadingExisting}
      emptyMessage="Create a DishList first to add recipes to it."
      errorMessage={
        addMutation.isError || removeMutation.isError
          ? getErrorMessage(
              addMutation.error ?? removeMutation.error,
              "Failed to update recipe DishLists. Please try again.",
            )
          : undefined
      }
      notice={
        createsCopy ? (
          <Text style={styles.copyNotice}>
            Saving “{recipeTitle}” creates your own copy. Future changes to the
            original won’t affect it.
          </Text>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  copyNotice: {
    ...typography.caption,
    color: theme.colors.neutral[600],
    lineHeight: 18,
  },
});
