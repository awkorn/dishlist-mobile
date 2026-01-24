import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  User as UserIcon,
  Crown,
  Clock,
  Trash2,
  RefreshCw,
} from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import { useCollaborators } from '../hooks/useCollaborators';
import type { Collaborator, PendingInvite } from '../types';

interface CollaboratorsModalProps {
  visible: boolean;
  onClose: () => void;
  dishListId: string;
  dishListTitle: string;
}

type ListItem =
  | { type: 'header'; title: string }
  | { type: 'owner'; data: NonNullable<ReturnType<typeof useCollaborators>['owner']> }
  | { type: 'collaborator'; data: Collaborator }
  | { type: 'pending'; data: PendingInvite }
  | { type: 'empty'; message: string };

export function CollaboratorsModal({
  visible,
  onClose,
  dishListId,
  dishListTitle,
}: CollaboratorsModalProps) {
  const {
    owner,
    collaborators,
    pendingInvites,
    isOwner,
    isLoading,
    isRemoving,
    isRevoking,
    isResending,
    handleRemoveCollaborator,
    handleRevokeInvite,
    handleResendInvite,
  } = useCollaborators({ dishListId, enabled: visible });

  // Build list data with sections
  const listData: ListItem[] = [];

  if (owner) {
    listData.push({ type: 'header', title: 'Owner' });
    listData.push({ type: 'owner', data: owner });
  }

  if (collaborators.length > 0) {
    listData.push({ type: 'header', title: 'Collaborators' });
    collaborators.forEach((c) => listData.push({ type: 'collaborator', data: c }));
  }

  if (isOwner && pendingInvites.length > 0) {
    listData.push({ type: 'header', title: 'Pending Invites' });
    pendingInvites.forEach((p) => listData.push({ type: 'pending', data: p }));
  }

  if (collaborators.length === 0 && pendingInvites.length === 0) {
    listData.push({ type: 'empty', message: 'No collaborators yet' });
  }

  const getDisplayName = useCallback(
    (user: { firstName?: string | null; lastName?: string | null; username?: string | null }) => {
      if (user.firstName) {
        return `${user.firstName} ${user.lastName || ''}`.trim();
      }
      return user.username || 'User';
    },
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      switch (item.type) {
        case 'header':
          return (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
            </View>
          );

        case 'owner':
          return (
            <View style={styles.userRow}>
              <View style={styles.userInfo}>
                {item.data.avatarUrl ? (
                  <Image source={{ uri: item.data.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <UserIcon size={20} color={theme.colors.neutral[400]} />
                  </View>
                )}
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{getDisplayName(item.data)}</Text>
                  {item.data.username && (
                    <Text style={styles.username}>@{item.data.username}</Text>
                  )}
                </View>
              </View>
              <View style={styles.ownerBadge}>
                <Crown size={14} color={theme.colors.warning[600]} />
                <Text style={styles.ownerText}>Owner</Text>
              </View>
            </View>
          );

        case 'collaborator':
          return (
            <View style={styles.userRow}>
              <View style={styles.userInfo}>
                {item.data.user.avatarUrl ? (
                  <Image source={{ uri: item.data.user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <UserIcon size={20} color={theme.colors.neutral[400]} />
                  </View>
                )}
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{getDisplayName(item.data.user)}</Text>
                  {item.data.user.username && (
                    <Text style={styles.username}>@{item.data.user.username}</Text>
                  )}
                </View>
              </View>
              {isOwner && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    handleRemoveCollaborator(item.data.user.uid, getDisplayName(item.data.user))
                  }
                  disabled={isRemoving}
                >
                  {isRemoving ? (
                    <ActivityIndicator size="small" color={theme.colors.error[500]} />
                  ) : (
                    <Trash2 size={18} color={theme.colors.error[500]} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          );

        case 'pending':
          return (
            <View style={styles.userRow}>
              <View style={styles.userInfo}>
                {item.data.user.avatarUrl ? (
                  <Image source={{ uri: item.data.user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <UserIcon size={20} color={theme.colors.neutral[400]} />
                  </View>
                )}
                <View style={styles.nameContainer}>
                  <Text style={styles.userName}>{getDisplayName(item.data.user)}</Text>
                  <View style={styles.pendingBadge}>
                    <Clock size={12} color={theme.colors.warning[600]} />
                    <Text style={styles.pendingText}>Pending</Text>
                  </View>
                </View>
              </View>
              <View style={styles.pendingActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleResendInvite(item.data.id)}
                  disabled={isResending}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                  ) : (
                    <RefreshCw size={18} color={theme.colors.primary[500]} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    handleRevokeInvite(item.data.id, getDisplayName(item.data.user))
                  }
                  disabled={isRevoking}
                >
                  {isRevoking ? (
                    <ActivityIndicator size="small" color={theme.colors.error[500]} />
                  ) : (
                    <Trash2 size={18} color={theme.colors.error[500]} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );

        case 'empty':
          return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{item.message}</Text>
            </View>
          );

        default:
          return null;
      }
    },
    [
      isOwner,
      isRemoving,
      isRevoking,
      isResending,
      getDisplayName,
      handleRemoveCollaborator,
      handleRevokeInvite,
      handleResendInvite,
    ]
  );

  const keyExtractor = useCallback((item: ListItem, index: number) => {
    switch (item.type) {
      case 'header':
        return `header-${item.title}`;
      case 'owner':
        return `owner-${item.data.uid}`;
      case 'collaborator':
        return `collab-${item.data.id}`;
      case 'pending':
        return `pending-${item.data.id}`;
      case 'empty':
        return 'empty';
      default:
        return `item-${index}`;
    }
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {dishListTitle}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          </View>
        ) : (
          <FlatList
            data={listData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing.md,
  },
  headerSpacer: {
    width: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: theme.spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: theme.colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.neutral[200],
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  userName: {
    ...typography.body,
    color: theme.colors.textPrimary,
  },
  username: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginTop: 2,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  ownerText: {
    ...typography.caption,
    color: theme.colors.warning[700],
    marginLeft: 4,
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pendingText: {
    ...typography.caption,
    color: theme.colors.warning[600],
    marginLeft: 4,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.sm,
  },
  emptyContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing['4xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
  },
});

export default CollaboratorsModal;