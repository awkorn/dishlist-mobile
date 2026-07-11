import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import type { DishListOwner } from '@features/dishlist/types';
import Avatar from '@components/ui/Avatar';

interface CollaboratorPreviewProps {
  owner: DishListOwner;
  collaboratorCount: number;
  onPress: () => void;
}

const AVATAR_SIZE = 28;
const AVATAR_OVERLAP = 10;

export function CollaboratorPreview({
  owner,
  collaboratorCount,
  onPress,
}: CollaboratorPreviewProps) {
  const ownerDisplayName = owner.firstName
    ? `${owner.firstName} ${owner.lastName || ''}`.trim()
    : owner.username || 'Owner';

  const hasCollaborators = collaboratorCount > 0;

  // Build display text
  const displayText = hasCollaborators
    ? `${ownerDisplayName} + ${collaboratorCount} ${collaboratorCount === 1 ? 'other' : 'others'}`
    : ownerDisplayName;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Stacked Avatars */}
      <View style={styles.avatarStack}>
        {/* Owner Avatar (always first/bottom) */}
        <View style={[styles.avatarWrapper, { zIndex: 2 }]}>
          <Avatar {...owner} size={AVATAR_SIZE - 4} colorIndex={0} />
        </View>

        {/* Second avatar placeholder for collaborators */}
        {hasCollaborators && (
          <View
            style={[
              styles.avatarWrapper,
              styles.stackedAvatar,
              { zIndex: 1 },
            ]}
          >
            <View style={styles.collaboratorCountAvatar}>
              <Text style={styles.collaboratorCountText}>+{collaboratorCount}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Name Text */}
      <Text style={styles.nameText} numberOfLines={1}>
        {displayText}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: theme.colors.background,
    backgroundColor: theme.colors.background,
  },
  stackedAvatar: {
    marginLeft: -AVATAR_OVERLAP,
  },
  collaboratorCountAvatar: {
    width: AVATAR_SIZE - 4,
    height: AVATAR_SIZE - 4,
    borderRadius: (AVATAR_SIZE - 4) / 2,
    backgroundColor: theme.colors.avatarWarm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collaboratorCountText: {
    ...typography.caption,
    color: theme.colors.textPrimary,
    fontSize: 10,
    lineHeight: 12,
  },
  nameText: {
    ...typography.button,
    color: theme.colors.neutral[600],
    marginLeft: 6,
    flexShrink: 1,
  },
});
