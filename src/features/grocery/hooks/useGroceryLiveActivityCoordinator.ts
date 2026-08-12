import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@lib/queryKeys";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { groceryStorage } from "../services/groceryStorage";
import { groceryLockScreenService } from "../services/groceryLockScreenService";

/**
 * Reconciles an existing system Live Activity after app relaunch/foreground
 * and removes it whenever there is no authenticated account.
 */
export function useGroceryLiveActivityCoordinator() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const reconcile = useCallback(async () => {
    if (loading) return;

    if (!userId) {
      try {
        await groceryLockScreenService.consumeCheckedItemIds();
        await groceryLockScreenService.end();
      } catch (error) {
        console.warn("Unable to end grocery Live Activity after sign out:", error);
      }
      return;
    }

    try {
      const pendingItemIds =
        await groceryLockScreenService.consumeCheckedItemIds();
      const items = pendingItemIds.length
        ? await groceryStorage.checkItems(userId, pendingItemIds)
        : await groceryStorage.loadItems(userId);

      if (pendingItemIds.length) {
        queryClient.setQueryData(queryKeys.grocery.list(userId), items);
      }

      await groceryLockScreenService.sync(items);
    } catch (error) {
      // A storage read error must not make a previously valid Live Activity
      // disappear; the grocery screen will surface the underlying error.
      console.warn("Unable to reconcile grocery Live Activity:", error);
    }
  }, [loading, queryClient, userId]);

  useEffect(() => {
    void reconcile();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void reconcile();
      }
    });

    return () => subscription?.remove();
  }, [reconcile]);
}
