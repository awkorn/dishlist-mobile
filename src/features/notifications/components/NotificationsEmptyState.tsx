import React from "react";
import { EmptyState } from "@components/ui";

export function NotificationsEmptyState() {
  return (
    <EmptyState
      title="No Notifications"
      message="When you receive notifications, they'll appear here"
    />
  );
}
