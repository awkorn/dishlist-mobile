import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createDishList,
  pinDishList,
  unpinDishList,
  DishList,
  updateDishList,
} from "../../services/api";
import { queryKeys } from "../../lib/queryKeys";
import { Alert } from "react-native";

export const useCreateDishList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDishList,

    onMutate: async (newDishList) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.dishLists.all });

      // Create optimistic DishList
      const optimisticDishList: DishList = {
        id: `temp-${Date.now()}`,
        title: newDishList.title,
        description: newDishList.description,
        visibility: newDishList.visibility || "PUBLIC",
        isDefault: false,
        isPinned: false,
        recipeCount: 0,
        isOwner: true,
        isCollaborator: false,
        isFollowing: false,
        owner: {
          uid: "current-user",
          username: "",
          firstName: "",
          lastName: "",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Snapshot previous state for rollback
      const previousMyLists = queryClient.getQueryData<DishList[]>(
        queryKeys.dishLists.list("my")
      );
      const previousAllLists = queryClient.getQueryData<DishList[]>(
        queryKeys.dishLists.list("all")
      );

      // Optimistically update UI
      if (previousMyLists) {
        queryClient.setQueryData<DishList[]>(queryKeys.dishLists.list("my"), [
          optimisticDishList,
          ...previousMyLists,
        ]);
      }

      if (previousAllLists) {
        queryClient.setQueryData<DishList[]>(queryKeys.dishLists.list("all"), [
          optimisticDishList,
          ...previousAllLists,
        ]);
      }

      return { previousMyLists, previousAllLists };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousMyLists) {
        queryClient.setQueryData(
          queryKeys.dishLists.list("my"),
          context.previousMyLists
        );
      }
      if (context?.previousAllLists) {
        queryClient.setQueryData(
          queryKeys.dishLists.list("all"),
          context.previousAllLists
        );
      }

      Alert.alert("Error", "Failed to create DishList. Please try again.");
    },

    onSuccess: (data) => {
      // Replace temp optimistic data with real server data
      queryClient.setQueryData<DishList[]>(
        queryKeys.dishLists.list("my"),
        (old) => {
          if (!old) return [data];
          return [data, ...old.filter((item) => !item.id.startsWith("temp-"))];
        }
      );

      queryClient.setQueryData<DishList[]>(
        queryKeys.dishLists.list("all"),
        (old) => {
          if (!old) return [data];
          return [data, ...old.filter((item) => !item.id.startsWith("temp-"))];
        }
      );
    },

    onSettled: () => {
      // Ensure cache is fresh after mutation completes
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    },
  });
};

export const useUpdateDishList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dishListId, ...data }: {
      dishListId: string;
      title: string;
      description?: string;
      visibility: "PUBLIC" | "PRIVATE";
    }) => updateDishList(dishListId, data),

    onMutate: async ({ dishListId, title, description, visibility }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.dishLists.all });

      // Snapshot previous state
      const previousDetail = queryClient.getQueryData(
        queryKeys.dishLists.detail(dishListId)
      );
      const previousAllLists = queryClient.getQueryData<DishList[]>(
        queryKeys.dishLists.list("all")
      );
      const previousMyLists = queryClient.getQueryData<DishList[]>(
        queryKeys.dishLists.list("my")
      );

      // Optimistically update detail view
      queryClient.setQueryData(
        queryKeys.dishLists.detail(dishListId),
        (old: any) => ({
          ...old,
          title,
          description,
          visibility,
          updatedAt: new Date().toISOString(),
        })
      );

      // Optimistically update list views
      const updateInList = (lists: DishList[] | undefined) => {
        if (!lists) return lists;
        return lists.map((list) =>
          list.id === dishListId
            ? { ...list, title, description, visibility, updatedAt: new Date().toISOString() }
            : list
        );
      };

      queryClient.setQueryData(
        queryKeys.dishLists.list("all"),
        updateInList(previousAllLists)
      );
      queryClient.setQueryData(
        queryKeys.dishLists.list("my"),
        updateInList(previousMyLists)
      );

      return { previousDetail, previousAllLists, previousMyLists };
    },

    onError: (error, variables, context) => {
      // Rollback
      if (context?.previousDetail) {
        queryClient.setQueryData(
          queryKeys.dishLists.detail(variables.dishListId),
          context.previousDetail
        );
      }
      if (context?.previousAllLists) {
        queryClient.setQueryData(
          queryKeys.dishLists.list("all"),
          context.previousAllLists
        );
      }
      if (context?.previousMyLists) {
        queryClient.setQueryData(
          queryKeys.dishLists.list("my"),
          context.previousMyLists
        );
      }

      Alert.alert("Error", "Failed to update DishList. Please try again.");
    },

    onSuccess: (data, variables) => {
      // Replace optimistic data with real server response
      queryClient.setQueryData(
        queryKeys.dishLists.detail(variables.dishListId),
        data
      );
    },

    onSettled: () => {
      // Refresh to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    },
  });
};

/**
 * Hook for pinning/unpinning a DishList
 */
export const useTogglePinDishList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dishListId,
      isPinned,
    }: {
      dishListId: string;
      isPinned: boolean;
    }) => {
      return isPinned ? unpinDishList(dishListId) : pinDishList(dishListId);
    },

    onMutate: async ({ dishListId, isPinned }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dishLists.all });

      // Optimistically update all lists that contain this DishList
      const updateDishListInCache = (lists: DishList[] | undefined) => {
        if (!lists) return lists;
        return lists.map((list) =>
          list.id === dishListId ? { ...list, isPinned: !isPinned } : list
        );
      };

      const previousStates = {
        all: queryClient.getQueryData<DishList[]>(
          queryKeys.dishLists.list("all")
        ),
        my: queryClient.getQueryData<DishList[]>(
          queryKeys.dishLists.list("my")
        ),
        collaborations: queryClient.getQueryData<DishList[]>(
          queryKeys.dishLists.list("collaborations")
        ),
      };

      queryClient.setQueryData(
        queryKeys.dishLists.list("all"),
        updateDishListInCache(previousStates.all)
      );
      queryClient.setQueryData(
        queryKeys.dishLists.list("my"),
        updateDishListInCache(previousStates.my)
      );
      queryClient.setQueryData(
        queryKeys.dishLists.list("collaborations"),
        updateDishListInCache(previousStates.collaborations)
      );

      return previousStates;
    },

    onError: (error, variables, context) => {
      if (context) {
        if (context.all) {
          queryClient.setQueryData(
            queryKeys.dishLists.list("all"),
            context.all
          );
        }
        if (context.my) {
          queryClient.setQueryData(queryKeys.dishLists.list("my"), context.my);
        }
        if (context.collaborations) {
          queryClient.setQueryData(
            queryKeys.dishLists.list("collaborations"),
            context.collaborations
          );
        }
      }
      Alert.alert("Error", "Failed to update pin status. Please try again.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
    },
  });
};

/**
 * Hook for following/unfollowing a DishList
 */
export const useToggleFollowDishList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dishListId,
      isFollowing,
      followFn,
      unfollowFn,
    }: {
      dishListId: string;
      isFollowing: boolean;
      followFn: (id: string) => Promise<void>;
      unfollowFn: (id: string) => Promise<void>;
    }) => {
      return isFollowing ? unfollowFn(dishListId) : followFn(dishListId);
    },

    onSuccess: (_, variables) => {
      // Invalidate detail view
      queryClient.invalidateQueries({
        queryKey: queryKeys.dishLists.detail(variables.dishListId),
      });

      // Invalidate list views
      queryClient.invalidateQueries({
        queryKey: queryKeys.dishLists.all,
      });
    },

    onError: (error) => {
      Alert.alert("Error", "Failed to update follow status. Please try again.");
    },
  });
};

/**
 * Hook for deleting a DishList
 */
export const useDeleteDishList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dishListId: string) => {
      const { deleteDishList } = await import("../../services/api");
      await deleteDishList(dishListId);
    },

    onMutate: async (dishListId) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.dishLists.all });

      // Snapshot previous state for rollback
      const previousStates = {
        all: queryClient.getQueryData<DishList[]>(
          queryKeys.dishLists.list("all")
        ),
        my: queryClient.getQueryData<DishList[]>(
          queryKeys.dishLists.list("my")
        ),
        collaborations: queryClient.getQueryData<DishList[]>(
          queryKeys.dishLists.list("collaborations")
        ),
      };

      // Optimistically remove from all caches
      const removeDishListFromCache = (lists: DishList[] | undefined) => {
        if (!lists) return lists;
        return lists.filter((list) => list.id !== dishListId);
      };

      queryClient.setQueryData(
        queryKeys.dishLists.list("all"),
        removeDishListFromCache(previousStates.all)
      );
      queryClient.setQueryData(
        queryKeys.dishLists.list("my"),
        removeDishListFromCache(previousStates.my)
      );
      queryClient.setQueryData(
        queryKeys.dishLists.list("collaborations"),
        removeDishListFromCache(previousStates.collaborations)
      );

      return previousStates;
    },

    onError: (error, dishListId, context) => {
      // Rollback on error
      if (context) {
        if (context.all) {
          queryClient.setQueryData(
            queryKeys.dishLists.list("all"),
            context.all
          );
        }
        if (context.my) {
          queryClient.setQueryData(queryKeys.dishLists.list("my"), context.my);
        }
        if (context.collaborations) {
          queryClient.setQueryData(
            queryKeys.dishLists.list("collaborations"),
            context.collaborations
          );
        }
      }

      // Extract error message
      const errorMessage =
        (error as any)?.response?.data?.error ||
        "Failed to delete DishList. Please try again.";
      Alert.alert("Error", errorMessage);
    },

    onSuccess: (_, dishListId) => {
      // Remove from detail cache
      queryClient.removeQueries({
        queryKey: queryKeys.dishLists.detail(dishListId),
      });

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.dishLists.all,
      });
    },
  });
};
