import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRecipe } from "../../services/api";
import { Alert } from "react-native";

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, data }: { recipeId: string; data: any }) =>
      updateRecipe(recipeId, data),

    onMutate: async ({ recipeId, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["recipe", recipeId] });

      // Snapshot previous value
      const previousRecipe = queryClient.getQueryData(["recipe", recipeId]);

      // Optimistically update
      queryClient.setQueryData(["recipe", recipeId], (old: any) => ({
        ...old,
        ...data,
        updatedAt: new Date().toISOString(),
      }));

      return { previousRecipe, recipeId };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousRecipe) {
        queryClient.setQueryData(
          ["recipe", context.recipeId],
          context.previousRecipe
        );
      }
      Alert.alert("Error", "Failed to update recipe. Please try again.");
    },

    onSuccess: (data, variables) => {
      // Update with real server data
      queryClient.setQueryData(["recipe", variables.recipeId], data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["recipe", variables.recipeId] });
      queryClient.invalidateQueries({ queryKey: ["dishList"] });
    },
  });
};