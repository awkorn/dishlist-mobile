import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  User as UserIcon,
  MessageCircle,
  Link2,
  Check,
} from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import Button from '@components/ui/Button';
import { useInviteCollaborator } from '../hooks/useInviteCollaborator';
import type { InviteCollaboratorModalProps } from '../types';
import type { MutualUser } from '@features/share/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = 64;
const GRID_COLUMNS = 3;
const GRID_GAP = theme.spacing.lg;
const ITEM_WIDTH =
  (SCREEN_WIDTH - theme.spacing.xl * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS;

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
    isSending,
    isGeneratingLink,
    toggleUserSelection,
    clearSelection,
    handleSendToSelected,
    handleShareViaMessage,
    handleCopyLink,
    hasSelection,
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

  const renderUserItem = useCallback(
    ({ item }: { item: MutualUser }) => {
      const isSelected = selectedUserIds.has(item.uid);
      const displayName = item.firstName
        ? `${item.firstName} ${item.lastName || ''}`.trim()
        : item.username || 'User';

      return (
        <TouchableOpacity
          style={styles.userItem}
          onPress={() => toggleUserSelection(item.uid)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <UserIcon size={28} color={theme.colors.neutral[400]} />
              </View>
            )}

            {/* Selection checkmark overlay */}
            {isSelected && (
              <View style={styles.checkOverlay}>
                <Check size={20} color="white" strokeWidth={3} />
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
    [selectedUserIds, toggleUserSelection]
  );

  const renderEmptyState = useCallback(() => {
    if (isLoadingMutuals) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      );
    }

    if (searchQuery && filteredMutuals.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Results</Text>
          <Text style={styles.emptyText}>
            No mutuals found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    if (filteredMutuals.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Mutuals Yet</Text>
          <Text style={styles.emptyText}>
            Follow users who follow you back to invite them directly
          </Text>
        </View>
      );
    }

    return null;
  }, [isLoadingMutuals, searchQuery, filteredMutuals.length]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search size={20} color={theme.colors.neutral[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search mutuals"
              placeholderTextColor={theme.colors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {/* Mutuals Grid */}
          <FlatList
            data={filteredMutuals}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.uid}
            numColumns={GRID_COLUMNS}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            keyboardShouldPersistTaps="handled"
          />

          {/* Bottom Action Buttons */}
          <View style={styles.bottomActions}>
            {/* External Share Options */}
            <View style={styles.externalShareRow}>
              <TouchableOpacity
                style={styles.externalShareButton}
                onPress={handleShareViaMessage}
                disabled={isGeneratingLink}
              >
                <View style={[styles.externalShareIcon, styles.messageIcon]}>
                  {isGeneratingLink ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <MessageCircle size={24} color="white" fill="white" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.externalShareButton}
                onPress={handleCopyLink}
                disabled={isGeneratingLink}
              >
                <View style={[styles.externalShareIcon, styles.linkIcon]}>
                  {isGeneratingLink ? (
                    <ActivityIndicator size="small" color={theme.colors.neutral[600]} />
                  ) : (
                    <Link2 size={24} color={theme.colors.neutral[600]} />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Send Button - Only show when users are selected */}
            {hasSelection && (
              <Button
                title={`Invite ${selectionCount} ${
                  selectionCount === 1 ? 'Person' : 'People'
                }`}
                onPress={handleSendToSelected}
                loading={isSending}
                disabled={isSending}
                style={styles.sendButton}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.neutral[300],
    borderRadius: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing["2xl"],
    height: 40,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  gridContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: theme.spacing.lg,
  },
  userItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.xs,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: theme.colors.neutral[200],
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    ...typography.caption,
    color: theme.colors.secondary[50],
    textAlign: 'center',
    width: ITEM_WIDTH,
  },
  userNameSelected: {
    color: theme.colors.primary[600],
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing['4xl'],
    paddingVertical: theme.spacing['4xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: theme.colors.neutral[800],
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
    textAlign: 'center',
  },
  bottomActions: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  externalShareRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  externalShareButton: {
    padding: theme.spacing.xs,
  },
  externalShareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageIcon: {
    backgroundColor: '#34C759',
  },
  linkIcon: {
    backgroundColor: theme.colors.neutral[200],
  },
  sendButton: {
    height: 48,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
});

export default InviteCollaboratorModal;