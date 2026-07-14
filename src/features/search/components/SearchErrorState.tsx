import React from "react";
import { ErrorState } from "@components/ui";

interface SearchErrorStateProps {
  onRetry: () => void;
}

export function SearchErrorState({ onRetry }: SearchErrorStateProps) {
  return (
    <ErrorState
      title="Couldn't load results"
      message="Please check your connection and try again."
      onRetry={onRetry}
    />
  );
}
