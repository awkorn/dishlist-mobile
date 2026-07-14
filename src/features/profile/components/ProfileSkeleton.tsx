import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { theme } from "@styles/theme";

interface ProfileSkeletonProps {
  onBack: () => void;
}

const PROFILE_TILE_IDS = ["tile-1", "tile-2", "tile-3", "tile-4"] as const;

export function ProfileSkeleton({ onBack }: ProfileSkeletonProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.85],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={theme.colors.neutral[700]} />
        </TouchableOpacity>
        <View style={styles.headerActions} accessibilityElementsHidden>
          <Animated.View style={[styles.headerAction, { opacity }]} />
          <Animated.View style={[styles.headerAction, { opacity }]} />
        </View>
      </View>

      <View
        style={styles.loadingContent}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Loading profile"
        accessibilityLiveRegion="polite"
      >
        <Animated.View
          style={[styles.profileContent, { opacity }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.avatar} />

          <View style={styles.nameSection}>
            <View style={styles.name} />
            <View style={styles.username} />
          </View>
          <View style={styles.statsSection}>
            <View style={styles.stat}>
              <View style={styles.statNumber} />
              <View style={styles.statLabel} />
            </View>
            <View style={styles.stat}>
              <View style={styles.statNumber} />
              <View style={styles.statLabel} />
            </View>
          </View>

          <View style={styles.bioLine} />
          <View style={styles.bioLineShort} />

          <View style={styles.buttonRow}>
            <View style={styles.actionButton} />
            <View style={styles.actionButton} />
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.tabs, { opacity }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.tabPlaceholder} />
          <View style={styles.tabPlaceholder} />
        </Animated.View>

        <Animated.View
          style={[styles.tileGrid, { opacity }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {PROFILE_TILE_IDS.map((tileId, index) => (
            <View key={tileId} style={styles.tile}>
              <View style={styles.tileImage} />
              <View style={styles.tileBody}>
                <View style={styles.tileTitle} />
                <View
                  style={[
                    styles.tileSubtitle,
                    index % 2 === 0 && styles.tileSubtitleShort,
                  ]}
                />
              </View>
            </View>
          ))}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const skeletonColor = theme.colors.neutral[200];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  headerActions: {
    marginLeft: "auto",
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  headerAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: skeletonColor,
  },
  loadingContent: {
    flex: 1,
  },
  profileContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xl,
    alignItems: "center",
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: skeletonColor,
    marginBottom: 14,
  },
  nameSection: {
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  name: {
    width: 176,
    height: 28,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  username: {
    width: 94,
    height: 14,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  statsSection: {
    flexDirection: "row",
    gap: 48,
    marginTop: 18,
  },
  stat: {
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  statNumber: {
    width: 28,
    height: 18,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  statLabel: {
    width: 58,
    height: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  bioLine: {
    width: "88%",
    height: 14,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
    marginTop: theme.spacing.xl,
  },
  bioLineShort: {
    width: "64%",
    height: 14,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
    marginTop: theme.spacing.sm,
  },
  buttonRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: skeletonColor,
  },
  tabs: {
    flexDirection: "row",
    gap: theme.spacing["3xl"],
    paddingHorizontal: theme.spacing["3xl"],
    paddingVertical: theme.spacing.lg,
  },
  tabPlaceholder: {
    flex: 1,
    height: 18,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  tile: {
    width: "47.5%",
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
  },
  tileImage: {
    width: "100%",
    aspectRatio: 1.45,
    backgroundColor: skeletonColor,
  },
  tileBody: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  tileTitle: {
    width: "86%",
    height: 14,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  tileSubtitle: {
    width: "68%",
    height: 11,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  tileSubtitleShort: {
    width: "48%",
  },
});
