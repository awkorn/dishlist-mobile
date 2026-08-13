// Foreground reconciliation for share-extension imports. Push notifications
// are the primary completion signal; this hook covers users who declined push
// permission (and races where the user switches straight back to the app):
// on every foreground, poll the ids the extension queued in App Group storage.
// Results completed while the app was inactive reconcile silently; only work
// observed in progress during the current active session gets an in-app banner.

import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@providers/AuthProvider/AuthContext";
import { queryKeys } from "@lib/queryKeys";
import { toast } from "@components/ui/toast";
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
  const observedWhileActiveRef = useRef(new Set<string>());

  const settleImport = useCallback(
    (
      importId: string,
      outcome: "completed" | "failed",
      detail?: string | null,
      recipeId?: string | null,
      recipeTitle?: string | null,
      shouldShowBanner = false
    ) => {
      removePendingImportId(importId);
      observedWhileActiveRef.current.delete(importId);

      if (outcome === "completed") {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.dishLists.all,
        });
        void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
        if (shouldShowBanner) {
          toast.success(
            recipeTitle
              ? `"${recipeTitle}" was successfully added to My Recipes.`
              : "Recipe was successfully added to My Recipes.",
            {
              duration: 5000,
              hideIcon: true,
              action: recipeId
                ? {
                    label: "View",
                    onPress: () =>
                      navigation.navigate("RecipeDetail", { recipeId }),
                  }
                : undefined,
            }
          );
        }
      } else if (shouldShowBanner) {
        toast.error(detail ?? "Couldn't import recipe", { duration: 4500 });
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
              settleImport(
                importId,
                "completed",
                null,
                status.recipeId,
                status.recipeTitle,
                observedWhileActiveRef.current.has(importId) &&
                  AppState.currentState === "active"
              );
            } else if (status.status === "FAILED") {
              remaining.delete(importId);
              settleImport(
                importId,
                "failed",
                status.errorMessage,
                null,
                null,
                observedWhileActiveRef.current.has(importId) &&
                  AppState.currentState === "active"
              );
            } else if (AppState.currentState === "active") {
              // Only imports first observed as in progress during this active
              // session may produce an in-app banner. A terminal result found
              // immediately after launch/foreground was already represented by
              // its system notification and is reconciled silently.
              observedWhileActiveRef.current.add(importId);
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
      } else {
        // An import that completes after this point belongs to the background
        // system-notification path, even if polling continues briefly.
        observedWhileActiveRef.current.clear();
      }
    });
    return () => subscription.remove();
  }, [user, pollPendingImports]);
}
