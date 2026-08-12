import { requireOptionalNativeModule } from "expo-modules-core";

export interface NativeGroceryLiveActivityStatus {
  isSupported: boolean;
  areActivitiesEnabled: boolean;
  isActive: boolean;
  activityId?: string;
}

export interface DishListLiveActivityNativeModule {
  getStatus(): Promise<NativeGroceryLiveActivityStatus>;
  start(
    itemIds: string[],
    itemTexts: string[],
    remainingCount: number
  ): Promise<string>;
  update(
    itemIds: string[],
    itemTexts: string[],
    remainingCount: number
  ): Promise<boolean>;
  end(
    itemIds: string[],
    itemTexts: string[],
    remainingCount: number,
    dismissImmediately: boolean
  ): Promise<void>;
  consumeCheckedItemIds(): Promise<string[]>;
}

export default requireOptionalNativeModule<DishListLiveActivityNativeModule>(
  "DishListLiveActivity"
);
