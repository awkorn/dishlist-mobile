import React from "react";
import { ImageStyle, StyleProp, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

const FALLBACK_BACKGROUNDS = [
  theme.colors.avatarDefault,
  theme.colors.avatarWarm,
  theme.colors.avatarSage,
] as const;

interface AvatarProps {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  displayName?: string | null;
  size?: number;
  colorIndex?: number;
  backgroundColor?: string;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
}

export function getInitials({
  firstName,
  lastName,
  username,
  displayName,
}: Pick<
  AvatarProps,
  "firstName" | "lastName" | "username" | "displayName"
>): string {
  const nameParts = [firstName, lastName].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  if (nameParts.length > 0) {
    return nameParts
      .slice(0, 2)
      .map((part) => part.trim().charAt(0))
      .join("")
      .toUpperCase();
  }

  const fallback = displayName?.trim() || username?.trim() || "User";
  const words = fallback.split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`
      : words[0]?.slice(0, 2);

  return (initials || "U").toUpperCase();
}

export default function Avatar({
  avatarUrl,
  firstName,
  lastName,
  username,
  displayName,
  size = 44,
  colorIndex = 0,
  backgroundColor,
  style,
  accessibilityLabel,
}: AvatarProps) {
  const sharedStyle = [
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2 },
    style,
  ];
  const label =
    accessibilityLabel ||
    `${displayName || [firstName, lastName].filter(Boolean).join(" ") || username || "User"} avatar`;

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={sharedStyle}
        cachePolicy="memory-disk"
        accessibilityLabel={label}
      />
    );
  }

  const normalizedIndex =
    ((colorIndex % FALLBACK_BACKGROUNDS.length) +
      FALLBACK_BACKGROUNDS.length) %
    FALLBACK_BACKGROUNDS.length;

  return (
    <View
      style={[
        sharedStyle,
        {
          backgroundColor:
            backgroundColor || FALLBACK_BACKGROUNDS[normalizedIndex],
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize: Math.max(10, Math.round(size * 0.36)),
            lineHeight: Math.max(12, Math.round(size * 0.44)),
          },
        ]}
      >
        {getInitials({ firstName, lastName, username, displayName })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    ...typography.button,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
});
