import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { theme } from "@styles/theme";

interface RecipeDetailSkeletonProps {
  onBack: () => void;
}

const SKELETON_SECTIONS = [
  { id: "ingredients", rows: 5, numbered: false },
  { id: "instructions", rows: 4, numbered: true },
] as const;

export function RecipeDetailSkeleton({
  onBack,
}: RecipeDetailSkeletonProps) {
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
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={theme.colors.neutral[700]} />
        </TouchableOpacity>
        <Animated.View style={[styles.headerTitle, { opacity }]} />
        <View style={styles.headerButton} />
      </View>

      <View
        style={styles.loadingContent}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Loading recipe"
        accessibilityLiveRegion="polite"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Animated.View style={[styles.hero, { opacity }]} />

          <View style={styles.metaRow}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.metaItem}>
                <Animated.View style={[styles.metaLabel, { opacity }]} />
                <Animated.View style={[styles.metaValue, { opacity }]} />
              </View>
            ))}
          </View>

          <Animated.View style={[styles.primaryButton, { opacity }]} />
          {SKELETON_SECTIONS.map((section) => (
            <View key={section.id} style={styles.section}>
              <Animated.View style={[styles.sectionTitle, { opacity }]} />
              {Array.from({ length: section.rows }, (_, index) => (
                <View key={`${section.id}-${index}`} style={styles.row}>
                  <Animated.View
                    style={[
                      section.numbered
                        ? styles.stepPlaceholder
                        : styles.checkPlaceholder,
                      { opacity },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.rowText,
                      index === section.rows - 1 && styles.rowTextShort,
                      { opacity },
                    ]}
                  />
                </View>
              ))}
            </View>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    height: 20,
    width: "42%",
    marginHorizontal: "auto",
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  loadingContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing["4xl"],
  },
  hero: {
    width: "100%",
    height: 280,
    backgroundColor: skeletonColor,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing["2xl"],
  },
  metaItem: {
    flex: 1,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  metaLabel: {
    width: 64,
    height: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  metaValue: {
    width: 46,
    height: 16,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  primaryButton: {
    height: 48,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing["2xl"],
    borderRadius: theme.borderRadius.md,
    backgroundColor: skeletonColor,
  },
  section: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing["2xl"],
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    width: "38%",
    height: 24,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  checkPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: skeletonColor,
  },
  stepPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: skeletonColor,
  },
  rowText: {
    flex: 1,
    height: 15,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  rowTextShort: {
    maxWidth: "62%",
  },
});
