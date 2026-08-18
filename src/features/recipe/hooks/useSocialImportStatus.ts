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
  appendPendingImportId,
  clearPendingSharedUrl,
  readPendingImportIds,
  readPendingSharedImages,
  readPendingSharedUrl,
  removePendingImportId,
} from "@features/shareExtension/sharedStorage";
import type { SocialImportStatus } from "../types";

const POLL_INTERVAL_MS = 3500;
const POLL_BUDGET_MS = 2 * 60_000;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const isTerminal = (status: SocialImportStatus["status"]) =>
  ["COMPLETED", "REVIEW_REQUIRED", "FAILED", "CANCELLED"].includes(status);

export function useSocialImportStatus(): void {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const polling = useRef(false);
  const openedSharedImages = useRef(false);
  const cancelled = useRef(false);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakePoll = useRef<(() => void) | null>(null);

  const settleTerminal = useCallback(
    (record: SocialImportStatus) => {
      removePendingImportId(record.importId);
      if (
        record.status === "COMPLETED" ||
        record.status === "REVIEW_REQUIRED"
      ) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
      }
      // Import outcomes are durable Notification records. Refresh that source
      // of truth instead of replaying an ephemeral toast on every app launch.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
    [queryClient]
  );

  const reconcile = useCallback(async () => {
    if (polling.current || !user) return;
    polling.current = true;
    const deadline = Date.now() + POLL_BUDGET_MS;
    try {
      const pendingShare = readPendingSharedUrl();
      if (pendingShare) {
        try {
          const started = await recipeService.startSocialImport(pendingShare.url);
          if (!started.alreadySaved) appendPendingImportId(started.importId);
          clearPendingSharedUrl();
          toast.info(
            started.alreadySaved
              ? "That recipe is already in My Recipes."
              : "Your shared recipe import has started."
          );
        } catch {
          // Keep the payload: a later foreground/reconnect can safely retry.
        }
      }

      if (readPendingSharedImages() && !openedSharedImages.current) {
        openedSharedImages.current = true;
        navigation.navigate("SharedImageImport");
      }

      while (
        !cancelled.current &&
        Date.now() < deadline &&
        AppState.currentState !== "background" &&
        AppState.currentState !== "inactive"
      ) {
        const pendingIds = readPendingImportIds();
        const records = (
          await Promise.all(
            pendingIds.map(async (importId) => {
              try {
                return await recipeService.getImportStatus(importId);
              } catch (error) {
                const status = (error as { response?: { status?: number } })
                  ?.response?.status;
                if (status === 404) {
                  removePendingImportId(importId);
                }
                return null;
              }
            })
          )
        ).filter((record): record is SocialImportStatus => record !== null);
        const terminal = records.filter((record) => isTerminal(record.status));
        for (const record of terminal) {
          settleTerminal(record);
        }

        const locallyPending = readPendingImportIds() ?? [];
        const hasWork =
          records.some((record) =>
            record.status === "PENDING" || record.status === "PROCESSING"
          ) || locallyPending.length > 0;
        if (!hasWork) break;
        await new Promise<void>((resolve) => {
          wakePoll.current = resolve;
          pollTimer.current = setTimeout(resolve, POLL_INTERVAL_MS);
        });
        pollTimer.current = null;
        wakePoll.current = null;
      }
    } catch {
      // Network errors are intentionally quiet; React Query and the next
      // foreground event provide another durable reconciliation attempt.
    } finally {
      polling.current = false;
    }
  }, [navigation, settleTerminal, user]);

  useEffect(() => {
    if (!user) {
      openedSharedImages.current = false;
      return;
    }
    cancelled.current = false;
    void reconcile();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void reconcile();
    });
    return () => {
      cancelled.current = true;
      subscription?.remove();
      if (pollTimer.current) clearTimeout(pollTimer.current);
      wakePoll.current?.();
      pollTimer.current = null;
      wakePoll.current = null;
    };
  }, [reconcile, user]);
}
