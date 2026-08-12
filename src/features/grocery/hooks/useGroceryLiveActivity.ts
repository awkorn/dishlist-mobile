import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import {
  groceryLockScreenService,
  type GroceryLockScreenStatus,
} from "../services/groceryLockScreenService";
import type { GroceryItem } from "../types";

const initialStatus: GroceryLockScreenStatus = {
  isSupported: false,
  areActivitiesEnabled: false,
  isActive: false,
};

export function useGroceryLiveActivity(items: GroceryItem[]) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);

  const refreshStatus = useCallback(async () => {
    const nextStatus = await groceryLockScreenService.getStatus();
    setStatus(nextStatus);
    setIsLoading(false);
    return nextStatus;
  }, []);

  useEffect(() => {
    void refreshStatus();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshStatus();
      }
    });

    return () => subscription?.remove();
  }, [refreshStatus]);

  const uncheckedCount = useMemo(
    () => items.filter((item) => !item.checked).length,
    [items]
  );

  useEffect(() => {
    if (status.isActive && uncheckedCount === 0) {
      setStatus((current) => ({ ...current, isActive: false }));
    }
  }, [status.isActive, uncheckedCount]);

  const start = useCallback(async () => {
    setIsChanging(true);
    try {
      const activityId = await groceryLockScreenService.start(items);
      setStatus((current) => ({
        ...current,
        isSupported: true,
        areActivitiesEnabled: true,
        isActive: true,
        activityId,
      }));
    } finally {
      setIsChanging(false);
    }
  }, [items]);

  const end = useCallback(async () => {
    setIsChanging(true);
    try {
      await groceryLockScreenService.end(items);
      setStatus((current) => ({
        ...current,
        isActive: false,
        activityId: undefined,
      }));
    } finally {
      setIsChanging(false);
    }
  }, [items]);

  return {
    ...status,
    isLoading,
    isChanging,
    uncheckedCount,
    start,
    end,
    refreshStatus,
  };
}
