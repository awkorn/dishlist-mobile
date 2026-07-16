import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Trash2, ChevronRight } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import type {
  Notification,
  DishListInvitationData,
  DishListSharedData,
  RecipeSharedData,
  RecipeAddedData,
} from "../types";
import { parseNotificationData, isNavigableNotification } from "../types";
import Avatar from "@components/ui/Avatar";
import Button from "@components/ui/Button";

interface NotificationItemProps {
  notification: Notification;
  onDelete: (id: string) => void;
  onPress?: (notification: Notification) => void;
  onAccept?: (id: string) => void;           
  onDecline?: (id: string) => void;      
  onAcceptFollow?: (id: string) => void;     
  onDeclineFollow?: (id: string) => void;   
  isAccepting?: boolean;
  isDeclining?: boolean;
  isAcceptingFollow?: boolean;               
  isDecliningFollow?: boolean;               
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

    case "FOLLOW_REQUEST":
      return `${senderName} wants to follow you`;

    case "FOLLOW_ACCEPTED":
      return `${senderName} accepted your follow request`;

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

    case "REPORT_RESOLVED":
      return message;

    case "RECIPE_IMPORT_COMPLETED":
    case "RECIPE_IMPORT_FAILED":
      return message;

    default:
      return notification.title;
  }
}

/**
 * Check if notification type is actionable (has Accept/Decline)
 */
function isActionableNotification(type: string): boolean {
  return type === "DISHLIST_INVITATION" || type === "FOLLOW_REQUEST";
}

/**
 * Check if notification should show avatar
 */
function shouldShowAvatar(type: string): boolean {
  return type === "FOLLOW_REQUEST" || type === "FOLLOW_ACCEPTED";
}

export function NotificationItem({
  notification,
  onDelete,
  onPress,
  onAccept,
  onDecline,
  onAcceptFollow,
  onDeclineFollow,
  isAccepting = false,
  isDeclining = false,
  isAcceptingFollow = false,
  isDecliningFollow = false,
  showDivider = true,
}: NotificationItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const isInvitation = notification.type === "DISHLIST_INVITATION";
  const isFollowRequest = notification.type === "FOLLOW_REQUEST";
  const isActionable = isActionableNotification(notification.type);
  const isNavigable = isNavigableNotification(notification.type);
  const showAvatar = shouldShowAvatar(notification.type);
  
  const isActionInProgress = isAccepting || isDeclining || isAcceptingFollow || isDecliningFollow;

  const handlePress = () => {
    if (isNavigable && onPress && !isActionable) {
      onPress(notification);
    }
  };

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete(notification.id);
  };

  const handleAccept = () => {
    if (isFollowRequest && onAcceptFollow) {
      onAcceptFollow(notification.id);
    } else if (onAccept) {
      onAccept(notification.id);
    }
  };

  const handleDecline = () => {
    if (isFollowRequest && onDeclineFollow) {
      onDeclineFollow(notification.id);
    } else if (onDecline) {
      onDecline(notification.id);
    }
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={handleDelete}
      testID={`delete-notification-${notification.id}`}
      accessibilityRole="button"
      accessibilityLabel="Delete notification"
    >
      <Trash2 size={20} color={theme.colors.onPrimary} />
    </TouchableOpacity>
  );

  const message = buildNotificationMessage(notification);
  const timeAgo = formatRelativeTime(notification.createdAt);
  const avatarUrl = notification.sender?.avatarUrl;

  // Determine if the row should be tappable
  const isTappable = isNavigable && !isActionable;

  // Determine which loading states to show
  const currentlyAccepting = isFollowRequest ? isAcceptingFollow : isAccepting;
  const currentlyDeclining = isFollowRequest ? isDecliningFollow : isDeclining;

  const ContentWrapper = isTappable ? TouchableOpacity : View;
  const contentProps = isTappable
    ? { onPress: handlePress, activeOpacity: 0.7 }
    : {};

  // Swipe gestures are invisible to screen readers, so expose delete as an
  // accessibility action; "unread" is otherwise signaled by color only.
  // Actionable rows must NOT collapse into one accessible element (that would
  // hide the Accept/Decline buttons) — their label lives on the message text.
  const accessibleLabel = `${notification.isRead ? "" : "Unread. "}${message}. ${timeAgo}`;
  const deleteAction = {
    accessibilityActions: [{ name: "delete" as const, label: "Delete" }],
    onAccessibilityAction: (event: { nativeEvent: { actionName: string } }) => {
      if (event.nativeEvent.actionName === "delete") {
        onDelete(notification.id);
      }
    },
  };
  const accessibilityProps = isActionable
    ? {}
    : {
        accessible: true,
        accessibilityLabel: accessibleLabel,
        ...deleteAction,
      };

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
          {...accessibilityProps}
        >
          {/* Avatar for follow requests/accepted */}
          {showAvatar && (
            <View style={styles.avatarContainer}>
              <Avatar
                avatarUrl={avatarUrl}
                firstName={notification.sender?.firstName}
                lastName={notification.sender?.lastName}
                username={notification.sender?.username}
                size={40}
              />
            </View>
          )}

          <View style={styles.content}>
            <Text
              style={styles.message}
              accessibilityLabel={isActionable ? accessibleLabel : undefined}
            >
              {message}
            </Text>
            <Text style={styles.time}>{timeAgo}</Text>

            {/* Action buttons for invitations and follow requests */}
            {isActionable && (
              <View style={styles.actionButtons}>
                <Button
                  title="Decline"
                  style={styles.actionButton}
                  variant="outline"
                  size="sm"
                  onPress={handleDecline}
                  disabled={isActionInProgress}
                  loading={currentlyDeclining}
                  accessibilityLabel={
                    isFollowRequest ? "Decline follow request" : "Decline invitation"
                  }
                />

                <Button
                  title="Accept"
                  style={styles.actionButton}
                  size="sm"
                  onPress={handleAccept}
                  disabled={isActionInProgress}
                  loading={currentlyAccepting}
                  accessibilityLabel={
                    isFollowRequest ? "Accept follow request" : "Accept invitation"
                  }
                />
              </View>
            )}
          </View>

          {/* Navigation arrow for clickable notifications */}
          {isNavigable && !isActionable && (
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
    alignItems: "flex-start",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  unreadContainer: {
    backgroundColor: theme.colors.primary[50],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[500],
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
    marginTop: 2,
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
    ...typography.utilityCaption,
    color: theme.colors.neutral[500],
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  actionButton: {
    minWidth: 80,
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
