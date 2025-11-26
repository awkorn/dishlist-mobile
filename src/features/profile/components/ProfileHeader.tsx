import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { User as UserIcon } from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import type { UserProfile } from '../types';

interface ProfileHeaderProps {
  user: UserProfile;
  displayName: string;
  onEditPress?: () => void;
}

export function ProfileHeader({ user, displayName, onEditPress }: ProfileHeaderProps) {
  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <UserIcon size={40} color={theme.colors.neutral[400]} />
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{displayName}</Text>

          {user.isOwnProfile && onEditPress && (
            <TouchableOpacity onPress={onEditPress} style={styles.editIconBtn}>
              <Text style={styles.editIconText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {user.username && <Text style={styles.username}>@{user.username}</Text>}
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{user.followerCount}</Text>
            <Text style={styles.statLabel}>
              Follower{user.followerCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{user.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.neutral[200],
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    ...typography.heading3,
    color: theme.colors.neutral[900],
    marginBottom: 1,
  },
  username: {
    ...typography.body,
    color: theme.colors.neutral[600],
    marginBottom: 8,
  },
  bio: {
    ...typography.caption,
    color: theme.colors.neutral[700],
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 30,
    marginTop: 5,
    marginBottom: 16,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statNumber: {
    ...typography.body,
    fontWeight: '600',
    color: theme.colors.neutral[900],
  },
  statLabel: {
    ...typography.body,
    color: theme.colors.neutral[600],
  },
  editIconBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral[200],
  },
  editIconText: {
    ...typography.caption,
    fontWeight: '600',
    color: theme.colors.neutral[700],
  },
});