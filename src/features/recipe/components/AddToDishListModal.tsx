import React from "react";
import { StyleSheet, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { DishListPickerModal } from "@features/dishlist";
import { typography } from "@styles/typography";
import { theme } from "@styles/theme";
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

  const handleSelectDishList = (dishListId: string) => {
    addMutation.mutate(
      { dishListId, recipeId },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <DishListPickerModal
      visible={visible}
      onClose={onClose}
      onSelect={handleSelectDishList}
      title={createsCopy ? "Save to DishList" : "Add to DishList"}
      alreadySelectedDishListIds={existingDishListIds}
      isSelecting={addMutation.isPending}
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
