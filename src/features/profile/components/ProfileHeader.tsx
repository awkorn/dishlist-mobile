import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import {
  MoveLeft,
  Search,
  EllipsisVertical,
  User as UserIcon,
} from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { InlineSearchInput } from "@components/ui";
import type { UserProfile } from "../types";
import { FollowButton } from "./FollowButton";

const AVATAR_SIZE = 100;

interface ProfileHeaderProps {
  user: UserProfile;
  displayName: string;
  onBackPress: () => void;
  onEditPress?: () => void;
  onSharePress?: () => void;
  onMenuPress?: () => void;

  isSearchActive: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchChange: (query: string) => void;
  searchPlaceholder: string;
}

export function ProfileHeader({
  user,
  displayName,
  onBackPress,
  onEditPress,
  onSharePress,
  onMenuPress,
  isSearchActive,
  searchQuery,
  onSearchToggle,
  onSearchChange,
  searchPlaceholder,
}: ProfileHeaderProps) {
  const iconsOpacity = useRef(new Animated.Value(1)).current;
  const iconsScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(iconsOpacity, {
        toValue: isSearchActive ? 0 : 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(iconsScale, {
        toValue: isSearchActive ? 0 : 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSearchActive]);

  return (
    <View style={styles.container}>
      {/* White header */}
      <View style={styles.whiteSection}>
        {/* Top row */}
        <View style={styles.topRow}>
          {/* Back */}
          <TouchableOpacity onPress={onBackPress} style={styles.iconBtn}>
            <MoveLeft size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>

          {/* Inline search - will expand to fill space when active */}
          <InlineSearchInput
            isActive={isSearchActive}
            value={searchQuery}
            onChangeText={onSearchChange}
            onClose={onSearchToggle}
            placeholder={searchPlaceholder}
          />

          {/* Right icons - hide when search is active */}
          {!isSearchActive && (
            <Animated.View
              style={[
                styles.rightIcons,
                {
                  opacity: iconsOpacity,
                  transform: [{ scale: iconsScale }],
                },
              ]}
            >
              <TouchableOpacity onPress={onSearchToggle} style={styles.iconBtn}>
                <Search size={22} color={theme.colors.neutral[700]} />
              </TouchableOpacity>

              {/* Only show menu for own profile */}
              {user.isOwnProfile && (
                <TouchableOpacity onPress={onMenuPress} style={styles.iconBtn}>
                  <EllipsisVertical size={22} color={theme.colors.neutral[700]} />
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </View>
      </View>

      {/* Profile content */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={40} color={theme.colors.neutral[400]} />
            </View>
          )}
        </View>

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

        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

        {/* Action Buttons Row */}
        {user.isOwnProfile ? (
          // Own profile: Edit + Share buttons
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onEditPress}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onSharePress}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Share Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Other user's profile: Full-width follow button
          <View style={styles.followButtonRow}>
            <FollowButton
              userId={user.uid}
              followStatus={user.followStatus ?? "NONE"}
              fullWidth
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  whiteSection: {
    backgroundColor: theme.colors.surface,
    paddingBottom: AVATAR_SIZE / 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  avatarContainer: {
    marginTop: -(AVATAR_SIZE / 2),
    marginBottom: 12,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: theme.colors.neutral[200],
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: theme.colors.neutral[200],
    borderWidth: 3,
    borderColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
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
    color: theme.colors.neutral[500],
  },
  statsSection: {
    flexDirection: "row",
    gap: 20,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    ...typography.subtitle,
    color: theme.colors.neutral[700],
  },
  statLabel: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
  bio: {
    ...typography.body,
    color: theme.colors.neutral[700],
    marginTop: 8,
  },
  // Action buttons for own profile
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary[500],
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  actionButtonText: {
    ...typography.button,
    fontSize: 14,
    color: theme.colors.neutral[50],
  },
  // Follow button row for other profiles
  followButtonRow: {
    marginTop: 16,
  },
});