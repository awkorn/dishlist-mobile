// Foreground reconciliation for share-extension imports. Push notifications
// are the primary completion signal; this hook covers users who declined push
// permission (and races where the user switches straight back to the app):
// on every foreground, poll the ids the extension queued in App Group storage
// and surface the outcome in-app.

import { useCallback, useEffect, useRef } from "react";
import { Alert, AppState } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { queryKeys } from "@lib/queryKeys";
import { recipeService } from "../services/recipeService";
import {
  readPendingImportIds,
  removePendingImportId,
} from "@features/shareExtension/sharedStorage";

const POLL_INTERVAL_MS = 3000;
const POLL_BUDGET_MS = 60_000;

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function useSocialImportStatus(): void {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isPollingRef = useRef(false);

  const settleImport = useCallback(
    (importId: string, outcome: "completed" | "failed", detail?: string | null, recipeId?: string | null) => {
      removePendingImportId(importId);

      if (outcome === "completed") {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.dishLists.all,
        });
        void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
        Alert.alert(
          "Recipe saved",
          "Your recipe was added to My Recipes.",
          recipeId
            ? [
                { text: "Later", style: "cancel" },
                {
                  text: "View",
                  onPress: () =>
                    navigation.navigate("RecipeDetail", { recipeId }),
                },
              ]
            : undefined
        );
      } else {
        Alert.alert(
          "Couldn't save recipe",
          detail ?? "Something went wrong importing that post."
        );
      }
    },
    [navigation, queryClient]
  );

  const pollPendingImports = useCallback(async () => {
    if (isPollingRef.current) return;
    const pending = readPendingImportIds();
    if (pending.length === 0) return;

    isPollingRef.current = true;
    const deadline = Date.now() + POLL_BUDGET_MS;
    const remaining = new Set(pending);

    try {
      while (remaining.size > 0 && Date.now() < deadline) {
        for (const importId of [...remaining]) {
          try {
            const status = await recipeService.getImportStatus(importId);
            if (status.status === "COMPLETED") {
              remaining.delete(importId);
              settleImport(importId, "completed", null, status.recipeId);
            } else if (status.status === "FAILED") {
              remaining.delete(importId);
              settleImport(importId, "failed", status.errorMessage);
            }
          } catch (error: any) {
            if (error?.response?.status === 404) {
              // Unknown id (e.g. account switch) — drop it silently.
              remaining.delete(importId);
              removePendingImportId(importId);
            }
            // Transient errors: keep polling until the budget runs out.
          }
        }
        if (remaining.size > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, POLL_INTERVAL_MS)
          );
        }
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [settleImport]);

  useEffect(() => {
    if (!user) return;

    void pollPendingImports();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void pollPendingImports();
      }
    });
    return () => subscription.remove();
  }, [user, pollPendingImports]);
}
