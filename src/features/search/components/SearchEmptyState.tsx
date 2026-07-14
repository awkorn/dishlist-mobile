import React from "react";
import { EmptyState } from "@components/ui";

interface SearchEmptyStateProps {
  query: string;
}

export function SearchEmptyState({ query }: SearchEmptyStateProps) {
  return (
    <EmptyState
      title="No results found"
      message={`We couldn't find anything matching "${query}"\nTry adjusting your search or check the spelling`}
    />
  );
}
