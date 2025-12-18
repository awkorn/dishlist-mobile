import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Trash2, ChevronRight } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import type {
  Notification,
  NotificationType,
  DishListInvitationData,
  DishListSharedData,
  RecipeSharedData,
  RecipeAddedData,
} from "../types";
import { parseNotificationData, isNavigableNotification } from "../types";

interface NotificationItemProps {
  notification: Notification;
  onDelete: (id: string) => void;
  onPress?: (notification: Notification) => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
  showDivider?: boolean;
}

/**
 * Format relative time for notification display
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString();
}

/**
 * Build the notification message based on type
 */
function buildNotificationMessage(notification: Notification): string {
  const { type, message } = notification;
  const senderName = notification.sender?.username
    ? `@${notification.sender.username}`
    : notification.sender?.firstName || "Someone";

  switch (type) {
    case "DISHLIST_FOLLOWED":
      return `${senderName} started following your dishlist "${message}"`;

    case "USER_FOLLOWED":
      return `${senderName} started following you`;

    case "DISHLIST_INVITATION": {
      const data = parseNotificationData<DishListInvitationData>(notification.data);
      return `${senderName} invited you to collaborate on DishList "${data?.dishListTitle || message}"`;
    }

    case "DISHLIST_SHARED": {
      const data = parseNotificationData<DishListSharedData>(notification.data);
      return `${senderName} shared a DishList with you "${data?.dishListTitle || message}"`;
    }

    case "RECIPE_SHARED": {
      const data = parseNotificationData<RecipeSharedData>(notification.data);
      return `${senderName} shared a recipe with you "${data?.recipeTitle || message}"`;
    }

    case "RECIPE_ADDED": {
      const data = parseNotificationData<RecipeAddedData>(notification.data);
      return `${senderName} added a recipe to dishlist "${data?.dishListTitle || message}"`;
    }

    case "COLLABORATION_ACCEPTED": {
      return `${senderName} accepted your invitation to collaborate on "${message}"`;
    }

    case "COLLABORATION_DECLINED": {
      return `${senderName} declined your invitation to collaborate on "${message}"`;
    }

    case "SYSTEM_UPDATE":
      return notification.title || "System update";

    default:
      return notification.title;
  }
}

export function NotificationItem({
  notification,
  onDelete,
  onPress,
  onAccept,
  onDecline,
  isAccepting = false,
  isDeclining = false,
  showDivider = true,
}: NotificationItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const isInvitation = notification.type === "DISHLIST_INVITATION";
  const isNavigable = isNavigableNotification(notification.type);
  const isActionInProgress = isAccepting || isDeclining;

  const handlePress = () => {
    if (isNavigable && onPress) {
      onPress(notification);
    }
  };

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete(notification.id);
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept(notification.id);
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline(notification.id);
    }
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={handleDelete}
      testID={`delete-notification-${notification.id}`}
    >
      <Trash2 size={20} color="white" />
    </TouchableOpacity>
  );

  const message = buildNotificationMessage(notification);
  const timeAgo = formatRelativeTime(notification.createdAt);

  // Determine if the row should be tappable
  const isTappable = isNavigable && !isInvitation;

  const ContentWrapper = isTappable ? TouchableOpacity : View;
  const contentProps = isTappable
    ? { onPress: handlePress, activeOpacity: 0.7 }
    : {};

  return (
    <View>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        enabled={!isActionInProgress}
      >
        <ContentWrapper
          style={[
            styles.container,
            !notification.isRead && styles.unreadContainer,
          ]}
          {...contentProps}
        >
          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
            <Text style={styles.time}>{timeAgo}</Text>

            {/* Invitation action buttons */}
            {isInvitation && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.declineButton]}
                  onPress={handleDecline}
                  disabled={isActionInProgress}
                >
                  {isDeclining ? (
                    <ActivityIndicator size="small" color={theme.colors.neutral[600]} />
                  ) : (
                    <Text style={styles.declineButtonText}>Decline</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={handleAccept}
                  disabled={isActionInProgress}
                >
                  {isAccepting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Navigation arrow for clickable notifications */}
          {isNavigable && !isInvitation && (
            <View style={styles.arrow}>
              <ChevronRight size={20} color={theme.colors.neutral[400]} />
            </View>
          )}
        </ContentWrapper>
      </Swipeable>
      {showDivider && <View style={styles.divider} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  unreadContainer: {
    backgroundColor: theme.colors.primary[50],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[500],
  },
  content: {
    flex: 1,
  },
  message: {
    ...typography.body,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  time: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
    minWidth: 80,
    alignItems: "center",
  },
  declineButton: {
    backgroundColor: theme.colors.neutral[200],
  },
  acceptButton: {
    backgroundColor: theme.colors.primary[500],
  },
  declineButtonText: {
    ...typography.button,
    fontSize: 14,
    color: theme.colors.neutral[700],
  },
  acceptButtonText: {
    ...typography.button,
    fontSize: 14,
    color: "#FFFFFF",
  },
  arrow: {
    marginLeft: theme.spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
});