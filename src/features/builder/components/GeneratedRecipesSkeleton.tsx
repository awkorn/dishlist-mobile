import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import { theme } from "@styles/theme";
import { CARD_GAP, CARD_WIDTH } from "./GeneratedRecipeCard";

const SKELETON_RECIPE_IDS = [
  "recipe-1",
  "recipe-2",
  "recipe-3",
  "recipe-4",
] as const;

export function GeneratedRecipesSkeleton() {
  const pulse = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pulse.stopAnimation();
      pulse.setValue(0.55);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse, reduceMotion]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.46, 0.92],
  });

  return (
    <View
      style={styles.grid}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Generating four recipes"
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
    >
      <View
        style={styles.cards}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {SKELETON_RECIPE_IDS.map((recipeId, index) => (
          <View key={recipeId} style={styles.card} testID="recipe-skeleton-card">
            <Animated.View style={[styles.image, { opacity }]} />
            <View style={styles.content}>
              <Animated.View style={[styles.title, { opacity }]} />
              <Animated.View
                style={[
                  styles.title,
                  index % 2 === 0
                    ? styles.titleSecondShort
                    : styles.titleSecondLong,
                  { opacity },
                ]}
              />
              <View style={styles.metaRow}>
                <Animated.View style={[styles.metaIcon, { opacity }]} />
                <Animated.View style={[styles.metaText, { opacity }]} />
                <Animated.View style={[styles.metaIcon, { opacity }]} />
                <Animated.View style={[styles.metaTextShort, { opacity }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const skeletonColor = theme.colors.neutral[200];

const styles = StyleSheet.create({
  grid: {
    width: "100%",
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  cards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    overflow: "hidden",
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  image: {
    width: "100%",
    height: CARD_WIDTH * 0.55,
    backgroundColor: theme.colors.neutral[100],
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    width: "90%",
    height: 13,
    borderRadius: 7,
    backgroundColor: skeletonColor,
    marginBottom: 6,
  },
  titleSecondShort: {
    width: "48%",
  },
  titleSecondLong: {
    width: "68%",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
    marginTop: 2,
    gap: 4,
  },
  metaIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: skeletonColor,
  },
  metaText: {
    width: 32,
    height: 9,
    borderRadius: 5,
    backgroundColor: skeletonColor,
    marginRight: 4,
  },
  metaTextShort: {
    width: 18,
    height: 9,
    borderRadius: 5,
    backgroundColor: skeletonColor,
  },
});
