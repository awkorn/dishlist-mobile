import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChefHat,
  CheckCircle2,
} from "lucide-react-native";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";
import { isIngredientInInstruction } from "../../utils/ingredientParser";

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

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const currentStepIngredients = React.useMemo(() => {
    if (!recipe.ingredients) return [];
    const instruction = recipe.instructions[currentStep];
    return recipe.ingredients.filter((ingredient) =>
      isIngredientInInstruction(ingredient, instruction)
    );
  }, [currentStep, recipe.ingredients, recipe.instructions]);

  const goToStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= recipe.instructions.length) return;
    
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setCurrentStep(stepIndex);
  };

  const totalSteps = recipe.instructions.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header - fixed */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
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
                    { width: `${progressPercentage}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Content - scrollable */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Step header */}
          <View style={styles.stepHeader}>
            <Text style={styles.stepTitle}>Step {currentStep + 1}</Text>
            {isLastStep && (
              <View style={styles.finalStepBadge}>
                <CheckCircle2
                  size={16}
                  color={theme.colors.success}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.finalStepText}>Final Step</Text>
              </View>
            )}
          </View>

          {/* Instruction */}
          <View style={styles.instructionSection}>
            <Text style={styles.sectionLabel}>Instruction</Text>
            <Text style={styles.instructionText}>
              {recipe.instructions[currentStep]}
            </Text>
          </View>

          {/* Ingredients */}
          {currentStepIngredients.length > 0 ? (
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
          ) : null}

          {/* Time Info */}
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
        </ScrollView>

        {/* Footer - fixed */}
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
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              isLastStep ? styles.doneButton : styles.nextButton,
            ]}
            onPress={() =>
              isLastStep ? handleClose() : goToStep(currentStep + 1)
            }
          >
            <Text
              style={[
                styles.navButtonText,
                isLastStep && styles.doneButtonText,
              ]}
            >
              {isLastStep ? "Done" : "Next"}
            </Text>
            {!isLastStep && (
              <ChevronRight size={24} color={theme.colors.primary[500]} />
            )}
            {isLastStep && <CheckCircle2 size={24} color="white" />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
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
    height: 6,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary[500],
    borderRadius: 3,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing["4xl"],
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing["2xl"],
  },
  stepTitle: {
    ...typography.heading3,
    color: theme.colors.primary[600],
  },
  finalStepBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  finalStepText: {
    ...typography.caption,
    color: theme.colors.success,
    fontWeight: "600",
  },
  instructionSection: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  sectionLabel: {
    ...typography.subtitle,
    fontSize: 14,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  instructionText: {
    ...typography.body,
    fontSize: 18,
    lineHeight: 28,
    color: theme.colors.neutral[800],
  },
  ingredientsSection: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.success + "10",
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.success + "30",
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
    flex: 1,
  },
  timeSection: {
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
  },
  timeRow: {
    flexDirection: "row",
    gap: theme.spacing.xl,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  timeText: {
    ...typography.body,
    color: theme.colors.neutral[700],
    fontSize: 15,
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
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minWidth: 120,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
  },
  navButtonDisabled: {
    opacity: 0.4,
    borderColor: theme.colors.neutral[300],
  },
  nextButton: {
    backgroundColor: theme.colors.surface,
  },
  doneButton: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  navButtonText: {
    ...typography.button,
    color: theme.colors.primary[500],
    fontSize: 16,
  },
  navButtonTextDisabled: {
    color: theme.colors.neutral[400],
  },
  doneButtonText: {
    color: "white",
  },
});