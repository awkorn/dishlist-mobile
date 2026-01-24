import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { User as UserIcon } from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import type { DishListOwner } from '@features/dishlist/types';

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
          {owner.avatarUrl ? (
            <Image source={{ uri: owner.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={14} color={theme.colors.neutral[400]} />
            </View>
          )}
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
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={14} color={theme.colors.neutral[400]} />
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
  avatar: {
    width: AVATAR_SIZE - 4, // Account for border
    height: AVATAR_SIZE - 4,
    borderRadius: (AVATAR_SIZE - 4) / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE - 4,
    height: AVATAR_SIZE - 4,
    borderRadius: (AVATAR_SIZE - 4) / 2,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameText: {
    ...typography.button,
    color: theme.colors.neutral[600],
    marginLeft: 6,
    flexShrink: 1,
  },
});