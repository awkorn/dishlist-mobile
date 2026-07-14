import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import {
  ChevronLeft,
  Search,
  EllipsisVertical,
} from "lucide-react-native";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { InlineSearchInput } from "@components/ui";
import Avatar from "@components/ui/Avatar";
import Button from "@components/ui/Button";
import type { UserProfile } from "../types";
import { FollowButton } from "./FollowButton";

const AVATAR_SIZE = 104;

interface ProfileHeaderProps {
  user: UserProfile;
  displayName: string;
  isOwnProfile: boolean;
  onBackPress: () => void;
  onEditPress?: () => void;
  onSharePress?: () => void;
  onMenuPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  isSearchActive: boolean;
  searchQuery: string;
  onSearchToggle: () => void;
  onSearchChange: (query: string) => void;
  searchPlaceholder: string;
}

export function ProfileHeader({
  user,
  displayName,
  isOwnProfile,
  onBackPress,
  onEditPress,
  onSharePress,
  onMenuPress,
  onFollowersPress,
  onFollowingPress,
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
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={theme.colors.neutral[700]} />
        </TouchableOpacity>

        <InlineSearchInput
          isActive={isSearchActive}
          value={searchQuery}
          onChangeText={onSearchChange}
          onClose={onSearchToggle}
          placeholder={searchPlaceholder}
        />

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
            <TouchableOpacity
              onPress={onSearchToggle}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Search profile content"
            >
              <Search size={22} color={theme.colors.neutral[700]} />
            </TouchableOpacity>

            {onMenuPress && (
              <TouchableOpacity
                onPress={onMenuPress}
                style={styles.iconBtn}
                accessibilityRole="button"
                accessibilityLabel="Profile options"
              >
                <EllipsisVertical
                  size={22}
                  color={theme.colors.neutral[700]}
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Avatar
            {...user}
            displayName={displayName}
            size={AVATAR_SIZE}
            style={styles.avatarBorder}
            accessibilityLabel={`${displayName}'s profile photo`}
          />
        </View>

        <View style={styles.nameSection}>
          <Text
            style={styles.displayName}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {displayName}
          </Text>
          {user.username && (
            <Text style={styles.username}>@{user.username}</Text>
          )}
        </View>

        <View style={styles.statsSection}>
          <TouchableOpacity
            style={styles.stat}
            onPress={onFollowersPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${user.followerCount} followers`}
          >
            <Text style={styles.statNumber}>{user.followerCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.stat}
            onPress={onFollowingPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${user.followingCount} following`}
          >
            <Text style={styles.statNumber}>{user.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

        {isOwnProfile ? (
          <View style={styles.actionButtonsRow}>
            <Button
              title="Edit Profile"
              style={styles.actionButton}
              variant="outline"
              size="sm"
              onPress={() => onEditPress?.()}
              accessibilityLabel="Edit profile"
            />

            <Button
              title="Share Profile"
              style={styles.actionButton}
              size="sm"
              onPress={() => onSharePress?.()}
              accessibilityLabel="Share profile"
            />
          </View>
        ) : (
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
  container: {
    backgroundColor: theme.colors.background,
  },
  topRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
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
    paddingTop: 4,
    paddingBottom: 20,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 14,
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  nameSection: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  displayName: {
    ...typography.editorialTitle,
    fontSize: 30,
    lineHeight: 38,
    color: theme.colors.neutral[900],
    textAlign: "center",
  },
  username: {
    ...typography.body,
    color: theme.colors.neutral[500],
    marginTop: 1,
    textAlign: "center",
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 48,
    marginTop: 18,
  },
  stat: {
    alignItems: "center",
    minWidth: 72,
  },
  statNumber: {
    fontFamily: "GeneralSans-SemiBold",
    fontSize: 17,
    lineHeight: 22,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    ...typography.body,
    fontSize: 15,
    color: theme.colors.neutral[500],
    marginTop: 1,
  },
  bio: {
    ...typography.body,
    color: theme.colors.neutral[700],
    marginTop: 16,
    maxWidth: 320,
    textAlign: "center",
    lineHeight: 22,
  },
  actionButtonsRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
  },
  followButtonRow: {
    alignSelf: "stretch",
    marginTop: 20,
  },
});
