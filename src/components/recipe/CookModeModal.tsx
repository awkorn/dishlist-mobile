import React, { useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChefHat,
} from "lucide-react-native";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";

interface CookModeModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: {
    title: string;
    instructions: string[];
    ingredients: string[];
    prepTime?: number;
    cookTime?: number;
  };
}

const { width } = Dimensions.get("window");

export default function CookModeModal({
  visible,
  onClose,
  recipe,
}: CookModeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const getStepIngredients = (instruction: string): string[] => {
    if (!recipe.ingredients) return [];

    return recipe.ingredients.filter((ingredient) => {
      // Extract key words from ingredient (remove measurements, prep methods)
      const ingredientWords = ingredient
        .toLowerCase()
        .replace(/\d+/g, "")
        .replace(/(cup|tbsp|tsp|oz|lb|g|kg|ml|l)\b/g, "")
        .replace(/(chopped|diced|sliced|minced|grated)\b/g, "")
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 2); // only meaningful words

      // Check if any ingredient words appear in the instruction
      return ingredientWords.some((word) =>
        instruction.toLowerCase().includes(word)
      );
    });
  };

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 100
        );
      },
      onPanResponderMove: (evt, gestureState) => {
        slideAnim.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;

        if (dx > 50 && currentStep > 0) {
          // Swipe right - go to previous step
          goToStep(currentStep - 1);
        } else if (dx < -50 && currentStep < recipe.instructions.length - 1) {
          // Swipe left - go to next step
          goToStep(currentStep + 1);
        } else {
          // Snap back to center
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const goToStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= recipe.instructions.length) return;

    const direction = stepIndex > currentStep ? -1 : 1;

    Animated.timing(slideAnim, {
      toValue: direction * width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(stepIndex);
      slideAnim.setValue(-direction * width);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const currentStepIngredients = getStepIngredients(
    recipe.instructions[currentStep]
  );
  const totalSteps = recipe.instructions.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={28} color={theme.colors.neutral[700]} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.recipeTitle} numberOfLines={1}>
              {recipe.title}
            </Text>
            <View style={styles.progressContainer}>
              <Text style={styles.stepCounter}>
                Step {currentStep + 1} of {totalSteps}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((currentStep + 1) / totalSteps) * 100}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.stepContainer,
              { transform: [{ translateX: slideAnim }] },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Step Header */}
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Step {currentStep + 1}</Text>
            </View>

            {/* Instruction */}
            <View style={styles.instructionSection}>
              <Text style={styles.sectionLabel}>Instruction</Text>
              <Text style={styles.instructionText}>
                {recipe.instructions[currentStep]}
              </Text>
            </View>

            {/* Step Ingredients */}
            {currentStepIngredients.length > 0 && (
              <View style={styles.ingredientsSection}>
                <Text style={styles.sectionLabel}>
                  Ingredients for this step
                </Text>
                {currentStepIngredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={styles.ingredientBullet} />
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Time Info (show on first step) */}
            {isFirstStep && (recipe.prepTime || recipe.cookTime) && (
              <View style={styles.timeSection}>
                <Text style={styles.sectionLabel}>Time Information</Text>
                <View style={styles.timeRow}>
                  {recipe.prepTime && (
                    <View style={styles.timeItem}>
                      <Clock size={16} color={theme.colors.neutral[600]} />
                      <Text style={styles.timeText}>
                        Prep: {recipe.prepTime}m
                      </Text>
                    </View>
                  )}
                  {recipe.cookTime && (
                    <View style={styles.timeItem}>
                      <ChefHat size={16} color={theme.colors.neutral[600]} />
                      <Text style={styles.timeText}>
                        Cook: {recipe.cookTime}m
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Navigation Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.navButton, isFirstStep && styles.navButtonDisabled]}
            onPress={() => goToStep(currentStep - 1)}
            disabled={isFirstStep}
          >
            <ChevronLeft
              size={24}
              color={
                isFirstStep
                  ? theme.colors.neutral[400]
                  : theme.colors.primary[500]
              }
            />
            <Text
              style={[
                styles.navButtonText,
                isFirstStep && styles.navButtonTextDisabled,
              ]}
            >
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, isLastStep && styles.navButtonDisabled]}
            onPress={() => goToStep(currentStep + 1)}
            disabled={isLastStep}
          >
            <Text
              style={[
                styles.navButtonText,
                isLastStep && styles.navButtonTextDisabled,
              ]}
            >
              {isLastStep ? "Done" : "Next"}
            </Text>
            <ChevronRight
              size={24}
              color={
                isLastStep
                  ? theme.colors.neutral[400]
                  : theme.colors.primary[500]
              }
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.surface,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  headerCenter: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  recipeTitle: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  stepCounter: {
    ...typography.caption,
    color: theme.colors.neutral[600],
    minWidth: 80,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary[500],
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    marginBottom: theme.spacing.xl,
  },
  stepTitle: {
    ...typography.heading3,
    color: theme.colors.primary[600],
    textAlign: "center",
  },
  instructionSection: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
  },
  sectionLabel: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  instructionText: {
    ...typography.body,
    fontSize: 18,
    lineHeight: 26,
    color: theme.colors.neutral[800],
  },
  ingredientsSection: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.neutral[50],
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  ingredientText: {
    ...typography.body,
    color: theme.colors.neutral[700],
    fontSize: 16,
  },
  timeSection: {
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  timeRow: {
    flexDirection: "row",
    gap: theme.spacing.lg,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  timeText: {
    ...typography.body,
    color: theme.colors.neutral[700],
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.surface,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minWidth: 100,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    ...typography.button,
    color: theme.colors.primary[500],
    fontSize: 16,
  },
  navButtonTextDisabled: {
    color: theme.colors.neutral[400],
  },
});
