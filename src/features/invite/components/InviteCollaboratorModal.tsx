import React, { useCallback } from "react";
import { UserPickerSheet } from "@components/ui";
import { useInviteCollaborator } from "../hooks/useInviteCollaborator";
import type { InviteCollaboratorModalProps } from "../types";

export function InviteCollaboratorModal({
  visible,
  onClose,
  dishListId,
  dishListTitle,
}: InviteCollaboratorModalProps) {
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
  } = useInviteCollaborator({
    dishListId,
    dishListTitle,
    onInviteSuccess: onClose,
  });

  const handleClose = useCallback(() => {
    clearSelection();
    onClose();
  }, [clearSelection, onClose]);

  return (
    <UserPickerSheet
      visible={visible}
      onClose={handleClose}
      title="Invite Collaborators"
      actionLabel={`Invite ${selectionCount} ${
        selectionCount === 1 ? "Person" : "People"
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
      emptyMessage="Follow users who follow you back to invite them directly"
      messageAccessibilityLabel="Share invite link via message"
      linkAccessibilityLabel="Copy invite link"
    />
  );
}

export default InviteCollaboratorModal;
