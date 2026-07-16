import React, { type ReactNode, useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Check, Link2, MessageCircle, Search } from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import Avatar from "./Avatar";
import Button from "./Button";
import Modal from "./Modal";

export interface UserPickerUser {
  uid: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface UserPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  actionLabel: string;
  onAction: () => void;
  users: UserPickerUser[];
  selectedUserIds: ReadonlySet<string>;
  onToggleUser: (userId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onShareViaMessage: () => void;
  onCopyLink: () => void;
  searchPlaceholder?: string;
  isLoadingUsers?: boolean;
  isUsersError?: boolean;
  onRetryUsers?: () => void;
  isActionLoading?: boolean;
  isSharingViaMessage?: boolean;
  isCopyingLink?: boolean;
  emptyTitle: string;
  emptyMessage: string;
  noResultsMessage?: string;
  messageAccessibilityLabel?: string;
  linkAccessibilityLabel?: string;
  linkOnlyContent?: ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AVATAR_SIZE = 64;
const GRID_COLUMNS = 3;
const GRID_GAP = theme.spacing.lg;
const ITEM_WIDTH =
  (SCREEN_WIDTH - theme.spacing.xl * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS;

export function UserPickerSheet({
  visible,
  onClose,
  title,
  actionLabel,
  onAction,
  users,
  selectedUserIds,
  onToggleUser,
  searchQuery,
  onSearchQueryChange,
  onShareViaMessage,
  onCopyLink,
  searchPlaceholder = "Search mutuals",
  isLoadingUsers = false,
  isUsersError = false,
  onRetryUsers,
  isActionLoading = false,
  isSharingViaMessage = false,
  isCopyingLink = false,
  emptyTitle,
  emptyMessage,
  noResultsMessage,
  messageAccessibilityLabel = "Share via message",
  linkAccessibilityLabel = "Copy link",
  linkOnlyContent,
}: UserPickerSheetProps) {
  const isExternalActionLoading = isSharingViaMessage || isCopyingLink;
  const hasSelection = selectedUserIds.size > 0;

  const renderUserItem = useCallback(
    ({ item }: { item: UserPickerUser }) => {
      const isSelected = selectedUserIds.has(item.uid);
      const displayName = item.firstName
        ? `${item.firstName} ${item.lastName || ""}`.trim()
        : item.username || "User";

      return (
        <TouchableOpacity
          style={styles.userItem}
          onPress={() => onToggleUser(item.uid)}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={displayName}
        >
          <View style={styles.avatarContainer}>
            <Avatar {...item} size={AVATAR_SIZE} />
            {isSelected && (
              <View style={styles.checkOverlay}>
                <Check
                  size={20}
                  color={theme.colors.onPrimary}
                  strokeWidth={3}
                />
              </View>
            )}
          </View>
          <Text
            style={[styles.userName, isSelected && styles.userNameSelected]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
        </TouchableOpacity>
      );
    },
    [onToggleUser, selectedUserIds],
  );

  const renderEmptyState = useCallback(() => {
    if (isLoadingUsers) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      );
    }

    if (isUsersError) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Couldn't Load People</Text>
          <Text style={styles.emptyText}>
            Something went wrong. Check your connection and try again.
          </Text>
          {onRetryUsers && (
            <Button
              title="Try Again"
              onPress={onRetryUsers}
              variant="secondary"
              style={styles.retryButton}
            />
          )}
        </View>
      );
    }

    if (searchQuery && users.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Results</Text>
          <Text style={styles.emptyText}>
            {noResultsMessage || `No mutuals found matching "${searchQuery}"`}
          </Text>
        </View>
      );
    }

    if (users.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      );
    }

    return null;
  }, [
    emptyMessage,
    emptyTitle,
    isLoadingUsers,
    isUsersError,
    noResultsMessage,
    onRetryUsers,
    searchQuery,
    users.length,
  ]);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      showDragHandle
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {linkOnlyContent ? (
          <View style={styles.linkOnlyContent}>{linkOnlyContent}</View>
        ) : (
          <>
            <View style={styles.searchContainer}>
              <Search size={20} color={theme.colors.neutral[400]} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.colors.neutral[400]}
                value={searchQuery}
                onChangeText={onSearchQueryChange}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                accessibilityLabel={searchPlaceholder}
              />
            </View>
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.uid}
              numColumns={GRID_COLUMNS}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
              keyboardShouldPersistTaps="handled"
            />
          </>
        )}

        <View style={styles.bottomActions}>
          <View style={styles.externalShareRow}>
            <TouchableOpacity
              style={styles.externalShareButton}
              onPress={onShareViaMessage}
              disabled={isExternalActionLoading}
              accessibilityRole="button"
              accessibilityLabel={messageAccessibilityLabel}
              accessibilityState={{
                busy: isSharingViaMessage,
                disabled: isExternalActionLoading,
              }}
            >
              <View style={[styles.externalShareIcon, styles.messageIcon]}>
                {isSharingViaMessage ? (
                  <ActivityIndicator
                    testID="message-share-loading"
                    size="small"
                    color={theme.colors.onPrimary}
                  />
                ) : (
                  <MessageCircle
                    size={24}
                    color={theme.colors.onPrimary}
                    fill={theme.colors.onPrimary}
                  />
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.externalShareButton}
              onPress={onCopyLink}
              disabled={isExternalActionLoading}
              accessibilityRole="button"
              accessibilityLabel={linkAccessibilityLabel}
              accessibilityState={{
                busy: isCopyingLink,
                disabled: isExternalActionLoading,
              }}
            >
              <View style={[styles.externalShareIcon, styles.linkIcon]}>
                {isCopyingLink ? (
                  <ActivityIndicator
                    testID="copy-link-loading"
                    size="small"
                    color={theme.colors.neutral[600]}
                  />
                ) : (
                  <Link2 size={24} color={theme.colors.neutral[600]} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {!linkOnlyContent && hasSelection && (
            <Button
              title={actionLabel}
              onPress={onAction}
              loading={isActionLoading}
              disabled={isActionLoading}
              style={styles.actionButton}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[100],
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    marginLeft: theme.spacing.sm,
    paddingVertical: 0,
    color: theme.colors.textPrimary,
  },
  gridContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  gridRow: {
    justifyContent: "flex-start",
    gap: GRID_GAP,
    marginBottom: theme.spacing.lg,
  },
  userItem: {
    width: ITEM_WIDTH,
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: theme.spacing.sm,
  },
  checkOverlay: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: theme.colors.primary[500],
  },
  userName: {
    ...typography.caption,
    width: "100%",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  userNameSelected: {
    fontFamily: typography.families.uiSemiBold,
    color: theme.colors.primary[600],
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing["4xl"],
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing["4xl"],
  },
  emptyTitle: {
    ...typography.subtitle,
    marginBottom: theme.spacing.sm,
    color: theme.colors.neutral[800],
    textAlign: "center",
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
  },
  retryButton: {
    marginTop: theme.spacing.lg,
  },
  linkOnlyContent: {
    flex: 1,
  },
  bottomActions: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.surface,
  },
  externalShareRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  externalShareButton: {
    padding: theme.spacing.xs,
  },
  externalShareIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  messageIcon: {
    backgroundColor: theme.colors.message,
  },
  linkIcon: {
    backgroundColor: theme.colors.neutral[200],
  },
  actionButton: {
    height: 48,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
});
