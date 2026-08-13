import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { DishListPickerModal } from "@features/dishlist";
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
  const { data: existingDishListIds = [], isLoading: loadingExisting } =
    useQuery({
      queryKey: ["recipe", recipeId, "dishlists"],
      queryFn: () => recipeService.getRecipeDishLists(recipeId),
      enabled: visible,
    });
  const addMutation = useAddRecipeToDishList();
  const [selectedDishListIds, setSelectedDishListIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedDishListIds(new Set());
      addMutation.reset();
    }
  }, [visible]);

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
    const dishListIds = Array.from(selectedDishListIds);
    if (dishListIds.length === 0 || isSaving) return;

    setIsSaving(true);
    try {
      for (const dishListId of dishListIds) {
        await addMutation.mutateAsync({ dishListId, recipeId });
      }

      toast.success(
        dishListIds.length === 1
          ? createsCopy
            ? "Recipe saved to DishList"
            : "Recipe added to DishList"
          : createsCopy
            ? `Recipe saved to ${dishListIds.length} DishLists`
            : `Recipe added to ${dishListIds.length} DishLists`,
      );
      onClose();
    } catch {
      // The mutation hook presents the API error and the picker stays open.
    } finally {
      setIsSaving(false);
    }
  }, [addMutation, createsCopy, isSaving, onClose, recipeId, selectedDishListIds]);

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
        addMutation.isError
          ? getErrorMessage(
              addMutation.error,
              "Failed to add recipe. Please try again.",
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
