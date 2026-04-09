import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { theme } from "@styles/theme";

const { width } = Dimensions.get("window");
const CARD_GAP = theme.spacing.md;
const HORIZONTAL_PADDING = theme.spacing.xl;
const CARD_WIDTH = (width - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

export function GeneratingSkeletonCards() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const SkeletonCard = () => (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.content}>
        <View style={styles.titleBar} />
        <View style={styles.descBar} />
        <View style={styles.metaBar} />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
      <View style={styles.row}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: CARD_GAP,
  },
  row: {
    flexDirection: "row",
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: "100%",
    height: CARD_WIDTH * 0.55,
    backgroundColor: theme.colors.neutral[200],
  },
  content: {
    padding: theme.spacing.md,
    gap: 6,
  },
  titleBar: {
    width: "80%",
    height: 14,
    borderRadius: 4,
    backgroundColor: theme.colors.neutral[200],
  },
  descBar: {
    width: "60%",
    height: 10,
    borderRadius: 4,
    backgroundColor: theme.colors.neutral[100],
  },
  metaBar: {
    width: "40%",
    height: 10,
    borderRadius: 4,
    backgroundColor: theme.colors.neutral[100],
  },
});
