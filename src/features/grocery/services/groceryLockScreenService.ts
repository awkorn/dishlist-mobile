import { Platform } from "react-native";
import DishListLiveActivity, {
  type NativeGroceryLiveActivityStatus,
} from "@modules/dishlist-live-activity";
import type { GroceryItem } from "../types";

const MAX_ACTIVITY_ITEMS = 24;
const MAX_ITEM_LENGTH = 72;

export interface GroceryLockScreenItem {
  id: string;
  text: string;
}

export interface GroceryLockScreenPayload {
  items: GroceryLockScreenItem[];
  remainingCount: number;
}

export interface GroceryLockScreenStatus
  extends NativeGroceryLiveActivityStatus {}

const unavailableStatus: GroceryLockScreenStatus = {
  isSupported: false,
  areActivitiesEnabled: false,
  isActive: false,
};

const normalizeItemText = (text: string) =>
  text.trim().replace(/\s+/g, " ").slice(0, MAX_ITEM_LENGTH);

export const buildGroceryLockScreenPayload = (
  items: GroceryItem[]
): GroceryLockScreenPayload => {
  const uncheckedItems = items.filter((item) => !item.checked);

  return {
    items: uncheckedItems
      .slice(0, MAX_ACTIVITY_ITEMS)
      .map((item) => ({ id: item.id, text: normalizeItemText(item.text) }))
      .filter((item) => item.text.length > 0),
    remainingCount: uncheckedItems.length,
  };
};

const getNativeModule = () =>
  Platform.OS === "ios" ? DishListLiveActivity : null;

export const groceryLockScreenService = {
  async getStatus(): Promise<GroceryLockScreenStatus> {
    const nativeModule = getNativeModule();
    if (!nativeModule) return unavailableStatus;

    try {
      return await nativeModule.getStatus();
    } catch (error) {
      console.warn("Unable to read grocery Live Activity status:", error);
      return unavailableStatus;
    }
  },

  async start(items: GroceryItem[]): Promise<string> {
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      throw new Error("Grocery Live Activities are unavailable on this device");
    }

    const payload = buildGroceryLockScreenPayload(items);
    if (payload.remainingCount === 0) {
      throw new Error("Add an unchecked grocery item before starting Shopping Mode");
    }

    return nativeModule.start(
      payload.items.map((item) => item.id),
      payload.items.map((item) => item.text),
      payload.remainingCount
    );
  },

  async sync(items: GroceryItem[]): Promise<boolean> {
    const nativeModule = getNativeModule();
    if (!nativeModule) return false;

    const payload = buildGroceryLockScreenPayload(items);

    try {
      if (payload.remainingCount === 0) {
        const status = await nativeModule.getStatus();
        if (!status.isActive) return false;

        await nativeModule.end([], [], 0, false);
        return true;
      }

      return await nativeModule.update(
        payload.items.map((item) => item.id),
        payload.items.map((item) => item.text),
        payload.remainingCount
      );
    } catch (error) {
      // Grocery storage is authoritative. A system-surface failure must never
      // roll back or interrupt a successfully saved list mutation.
      console.warn("Unable to update grocery Live Activity:", error);
      return false;
    }
  },

  async end(items: GroceryItem[] = []): Promise<void> {
    const nativeModule = getNativeModule();
    if (!nativeModule) return;

    const payload = buildGroceryLockScreenPayload(items);
    await nativeModule.end(
      payload.items.map((item) => item.id),
      payload.items.map((item) => item.text),
      payload.remainingCount,
      true
    );
  },

  async consumeCheckedItemIds(): Promise<string[]> {
    const nativeModule = getNativeModule();
    if (!nativeModule) return [];

    try {
      return await nativeModule.consumeCheckedItemIds();
    } catch (error) {
      console.warn("Unable to reconcile Lock Screen grocery changes:", error);
      return [];
    }
  },
};
