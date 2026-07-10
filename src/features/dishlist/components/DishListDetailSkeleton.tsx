import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { theme } from "@styles/theme";

interface DishListDetailSkeletonProps {
  onBack: () => void;
}

const { width } = Dimensions.get("window");
const TILE_WIDTH = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;
const SKELETON_RECIPE_IDS = [
  "recipe-1",
  "recipe-2",
  "recipe-3",
  "recipe-4",
  "recipe-5",
  "recipe-6",
] as const;

export function DishListDetailSkeleton({
  onBack,
}: DishListDetailSkeletonProps) {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>
          <Animated.View style={[styles.search, { opacity }]} />
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <Animated.View style={[styles.title, { opacity }]} />
            <View style={styles.infoRow}>
              <Animated.View style={[styles.infoText, { opacity }]} />
              <Animated.View style={[styles.infoDot, { opacity }]} />
              <Animated.View style={[styles.infoTextWide, { opacity }]} />
            </View>
            <View style={styles.collaboratorRow}>
              <View style={styles.avatarStack}>
                {["owner", "collaborator-1", "collaborator-2"].map(
                  (avatarId) => (
                    <Animated.View
                      key={avatarId}
                      style={[styles.avatar, { opacity }]}
                    />
                  ),
                )}
              </View>
              <Animated.View style={[styles.collaboratorText, { opacity }]} />
            </View>
          </View>
          <Animated.View style={[styles.menuButton, { opacity }]} />
        </View>
      </View>

      <View
        style={styles.loadingContent}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Loading DishList"
        accessibilityLiveRegion="polite"
      >
        <ScrollView
          contentContainerStyle={styles.recipeGrid}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {SKELETON_RECIPE_IDS.map((recipeId, index) => (
            <Animated.View
              key={recipeId}
              style={[styles.recipeTile, { opacity }]}
            >
              <View style={styles.recipeImage} />
              <View style={styles.recipeContent}>
                <View style={styles.recipeTitle} />
                <View
                  style={[
                    styles.recipeTitle,
                    styles.recipeTitleShort,
                    index % 2 === 0 && styles.recipeTitleShortest,
                  ]}
                />
                <View style={styles.recipeMetaRow}>
                  <View style={styles.recipeMeta} />
                  <View style={styles.recipeMetaShort} />
                </View>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
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
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  search: {
    flex: 1,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: skeletonColor,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  titleContent: {
    flex: 1,
  },
  title: {
    width: "64%",
    height: 29,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    width: 52,
    height: 15,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  infoTextWide: {
    width: 78,
    height: 15,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  infoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: skeletonColor,
  },
  collaboratorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  avatarStack: {
    flexDirection: "row",
  },
  avatar: {
    width: 24,
    height: 24,
    marginRight: -6,
    borderWidth: 2,
    borderColor: theme.colors.background,
    borderRadius: 12,
    backgroundColor: skeletonColor,
  },
  collaboratorText: {
    width: 76,
    height: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  menuButton: {
    width: 28,
    height: 28,
    marginLeft: theme.spacing.md,
    borderRadius: 14,
    backgroundColor: skeletonColor,
  },
  loadingContent: {
    flex: 1,
  },
  recipeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing["4xl"],
  },
  recipeTile: {
    width: TILE_WIDTH,
    overflow: "hidden",
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
  },
  recipeImage: {
    width: "100%",
    height: TILE_WIDTH * 0.75,
    backgroundColor: skeletonColor,
  },
  recipeContent: {
    padding: theme.spacing.md,
  },
  recipeTitle: {
    width: "88%",
    height: 13,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  recipeTitleShort: {
    width: "68%",
    marginBottom: theme.spacing.sm,
  },
  recipeTitleShortest: {
    width: "48%",
  },
  recipeMetaRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  recipeMeta: {
    width: 48,
    height: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  recipeMetaShort: {
    width: 28,
    height: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
});
