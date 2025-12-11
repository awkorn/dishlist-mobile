import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { 
  MoveLeft, 
  Search, 
  SquarePen, 
  EllipsisVertical,
  User as UserIcon 
} from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import type { UserProfile } from '../types';

const AVATAR_SIZE = 100;

interface ProfileHeaderProps {
  user: UserProfile;
  displayName: string;
  onBackPress: () => void;
  onEditPress?: () => void;
  onSearchPress?: () => void;
  onMenuPress?: () => void;
}

export function ProfileHeader({ 
  user, 
  displayName, 
  onBackPress,
  onEditPress,
  onSearchPress,
  onMenuPress,
}: ProfileHeaderProps) {
  return (
    <View style={styles.container}>
      {/* White section with icons */}
      <View style={styles.whiteSection}>
        <View style={styles.iconRow}>
          <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
            <MoveLeft size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>
          
          <View style={styles.rightIcons}>
            <TouchableOpacity onPress={onSearchPress} style={styles.iconButton}>
              <Search size={22} color={theme.colors.neutral[700]} />
            </TouchableOpacity>
            
            {user.isOwnProfile && onEditPress && (
              <TouchableOpacity onPress={onEditPress} style={styles.iconButton}>
                <SquarePen size={22} color={theme.colors.neutral[700]} />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
              <EllipsisVertical size={22} color={theme.colors.neutral[700]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Beige section with avatar and info */}
      <View style={styles.profileSection}>
        {/* Avatar - overlaps into white section */}
        <View style={styles.avatarContainer}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={40} color={theme.colors.neutral[400]} />
            </View>
          )}
        </View>

        {/* Name, username, and stats row - below avatar */}
        <View style={styles.infoRow}>
          <View style={styles.nameSection}>
            <Text style={styles.displayName}>{displayName}</Text>
            {user.username && (
              <Text style={styles.username}>@{user.username}</Text>
            )}
          </View>

          <View style={styles.statsSection}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{user.followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{user.followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Bio section - if exists */}
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  whiteSection: {
    backgroundColor: theme.colors.surface,
    paddingBottom: AVATAR_SIZE / 2, // Space for avatar to overlap
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  iconButton: {
    padding: 8,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  avatarContainer: {
    marginTop: -(AVATAR_SIZE / 2), // Pull avatar up into white section
    marginBottom: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: theme.colors.neutral[200],
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameSection: {
    flex: 1,
  },
  displayName: {
    ...typography.heading3,
    color: theme.colors.neutral[900],
    marginBottom: 2,
  },
  username: {
    ...typography.body,
    color: theme.colors.neutral[600],
  },
  statsSection: {
    flexDirection: 'row',
    gap: 20,
    marginRight: 30,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: theme.colors.neutral[600],
  },
  bio: {
    ...typography.body,
    color: theme.colors.neutral[700],
    marginTop: 12,
  },
});