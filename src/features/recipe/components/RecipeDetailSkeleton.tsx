import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, MoreHorizontal } from "lucide-react-native";
import { theme } from "@styles/theme";

interface RecipeDetailSkeletonProps {
  onBack: () => void;
}

const INGREDIENT_ROWS = 5;
const INSTRUCTION_ROWS = 4;

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
        <View style={styles.headerSpacer} />
        <View style={styles.headerButton}>
          <MoreHorizontal size={24} color={theme.colors.neutral[300]} />
        </View>
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
          <View style={styles.recipeHeading} testID="recipe-heading-skeleton">
            <Animated.View style={[styles.dishListTitle, { opacity }]} />
            <View style={styles.recipeTitle}>
              <Animated.View style={[styles.recipeTitleLine, { opacity }]} />
              <Animated.View
                style={[
                  styles.recipeTitleLine,
                  styles.recipeTitleLineShort,
                  { opacity },
                ]}
              />
            </View>

            <View
              style={styles.metaSection}
              testID="recipe-metadata-skeleton"
            >
              <View style={styles.metaRow}>
                {[0, 1, 2, 3].map((item) => (
                  <View key={item} style={styles.metaItem}>
                    <Animated.View style={[styles.metaLabel, { opacity }]} />
                    <Animated.View style={[styles.metaValue, { opacity }]} />
                  </View>
                ))}
              </View>
            </View>
          </View>

          <Animated.View
            style={[styles.cookModeButton, { opacity }]}
            testID="cook-mode-button-skeleton"
          />

          <View style={styles.section} testID="ingredients-skeleton">
            <View style={styles.sectionHeader}>
              <Animated.View style={[styles.sectionTitle, { opacity }]} />
              <Animated.View style={[styles.resetLink, { opacity }]} />
            </View>
            {Array.from({ length: INGREDIENT_ROWS }, (_, index) => (
              <View key={`ingredient-${index}`} style={styles.ingredientRow}>
                <Animated.View
                  style={[styles.checkPlaceholder, { opacity }]}
                />
                <Animated.View
                  style={[
                    styles.rowText,
                    index === INGREDIENT_ROWS - 1 && styles.rowTextShort,
                    { opacity },
                  ]}
                />
              </View>
            ))}
          </View>

          <View style={styles.section} testID="instructions-skeleton">
            <View style={styles.sectionHeader}>
              <Animated.View style={[styles.sectionTitle, { opacity }]} />
              <Animated.View style={[styles.resetLink, { opacity }]} />
            </View>
            {Array.from({ length: INSTRUCTION_ROWS }, (_, index) => (
              <View key={`instruction-${index}`} style={styles.instructionRow}>
                <Animated.View style={[styles.stepPlaceholder, { opacity }]} />
                <View style={styles.instructionText}>
                  <Animated.View style={[styles.rowText, { opacity }]} />
                  {index % 2 === 0 && (
                    <Animated.View
                      style={[
                        styles.rowText,
                        styles.instructionLineShort,
                        { opacity },
                      ]}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Animated.View
              style={[styles.nutritionTitle, { opacity }]}
            />
            <Animated.View style={[styles.bodyText, { opacity }]} />
            <Animated.View
              style={[styles.bodyText, styles.bodyTextShort, { opacity }]}
            />
            <Animated.View style={[styles.nutritionButton, { opacity }]} />
          </View>

          <View style={styles.gallerySection}>
            <Animated.View style={[styles.galleryTitle, { opacity }]} />
            <View style={styles.galleryRow}>
              {[0, 1].map((item) => (
                <Animated.View
                  key={item}
                  style={[styles.galleryImage, { opacity }]}
                />
              ))}
            </View>
          </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  headerButton: {
    padding: theme.spacing.xs,
  },
  headerSpacer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing["4xl"],
  },
  recipeHeading: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  dishListTitle: {
    width: 88,
    height: 12,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  recipeTitle: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  recipeTitleLine: {
    width: "88%",
    height: 30,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  recipeTitleLineShort: {
    width: "58%",
  },
  metaSection: {
    paddingVertical: theme.spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.neutral[300],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[300],
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  metaItem: {
    flex: 1,
    minWidth: 72,
    alignItems: "center",
  },
  metaLabel: {
    width: 56,
    height: 10,
    marginTop: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  metaValue: {
    width: 42,
    height: 16,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  cookModeButton: {
    height: 50,
    marginHorizontal: theme.spacing.xl,
    marginVertical: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    backgroundColor: skeletonColor,
  },
  section: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    width: 124,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  resetLink: {
    width: 38,
    height: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  instructionText: {
    flex: 1,
    gap: theme.spacing.sm,
    paddingTop: 5,
  },
  checkPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: skeletonColor,
  },
  stepPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: skeletonColor,
  },
  rowText: {
    flex: 1,
    height: 14,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  rowTextShort: {
    maxWidth: "62%",
  },
  instructionLineShort: {
    maxWidth: "72%",
  },
  nutritionTitle: {
    width: 210,
    height: 24,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  bodyText: {
    width: "100%",
    height: 12,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  bodyTextShort: {
    width: "68%",
  },
  nutritionButton: {
    height: 50,
    marginTop: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: skeletonColor,
  },
  gallerySection: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  galleryTitle: {
    width: 84,
    height: 24,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: skeletonColor,
  },
  galleryRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  galleryImage: {
    width: 184,
    height: 132,
    borderRadius: theme.borderRadius.md,
    backgroundColor: skeletonColor,
  },
});
