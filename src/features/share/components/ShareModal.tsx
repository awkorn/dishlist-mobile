import React, { useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { User as UserIcon } from "lucide-react-native";
import { UserPickerSheet } from "@components/ui";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { useShareModal } from "../hooks/useShareModal";
import type { ShareModalProps } from "../types";

export function ShareModal({
  visible,
  onClose,
  shareType,
  contentId,
  contentTitle,
}: ShareModalProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedUserIds,
    filteredMutuals,
    isLoadingMutuals,
    isMutualsError,
    isSending,
    isSharingViaMessage,
    isCopyingLink,
    toggleUserSelection,
    clearSelection,
    handleSendToSelected,
    handleShareViaMessage,
    handleCopyLink,
    refetchMutuals,
    selectionCount,
    supportsDirectShare,
  } = useShareModal({
    shareType,
    contentId,
    contentTitle,
    onShareSuccess: onClose,
  });

  const handleClose = useCallback(() => {
    clearSelection();
    onClose();
  }, [clearSelection, onClose]);

  return (
    <UserPickerSheet
      visible={visible}
      onClose={handleClose}
      title="Share"
      actionLabel={`Send to ${selectionCount} ${
        selectionCount === 1 ? "person" : "people"
      }`}
      onAction={handleSendToSelected}
      users={filteredMutuals}
      selectedUserIds={selectedUserIds}
      onToggleUser={toggleUserSelection}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onShareViaMessage={handleShareViaMessage}
      onCopyLink={handleCopyLink}
      searchPlaceholder="Search mutuals"
      isLoadingUsers={isLoadingMutuals}
      isUsersError={isMutualsError}
      onRetryUsers={() => refetchMutuals()}
      isActionLoading={isSending}
      isSharingViaMessage={isSharingViaMessage}
      isCopyingLink={isCopyingLink}
      emptyTitle="No Mutuals Yet"
      emptyMessage="Follow users who follow you back to share directly with them"
      linkOnlyContent={
        supportsDirectShare ? undefined : (
          <View style={styles.profileContent}>
            <View style={styles.profileShareIcon}>
              <UserIcon size={32} color={theme.colors.neutral[500]} />
            </View>
            <Text style={styles.profileTitle}>Share Profile</Text>
            <Text style={styles.profileSubtitle} numberOfLines={2}>
              {contentTitle}
            </Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  profileContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  profileShareIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
    borderRadius: 36,
    backgroundColor: theme.colors.neutral[100],
  },
  profileTitle: {
    ...typography.heading3,
    marginBottom: theme.spacing.xs,
    color: theme.colors.neutral[900],
    textAlign: "center",
  },
  profileSubtitle: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: "center",
  },
});

export default ShareModal;
