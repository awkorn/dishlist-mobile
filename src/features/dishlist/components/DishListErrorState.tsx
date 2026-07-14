import React from "react";
import { ErrorState } from "@components/ui";

interface DishListErrorStateProps {
  isOffline?: boolean;
  onRetry: () => void;
}

export function DishListErrorState({ isOffline, onRetry }: DishListErrorStateProps) {
  return (
    <ErrorState
      title="Unable to Load DishLists"
      message={
        isOffline
          ? "You're offline and no cached data is available"
          : "Something went wrong. Please try again."
      }
      onRetry={onRetry}
    />
  );
}
