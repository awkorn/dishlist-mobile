import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import type { GeneratedRecipe } from "../types";

interface GeneratedRecipeDetailSheetProps {
  recipe: GeneratedRecipe | null;
  visible: boolean;
  onClose: () => void;
  onSave: (recipe: GeneratedRecipe) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function GeneratedRecipeDetailSheet({
  recipe,
  visible,
  onClose,
  onSave,
}: GeneratedRecipeDetailSheetProps) {
  const insets = useSafeAreaInsets();

  if (!recipe) return null;

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const itemIngredients = recipe.ingredients.filter((i) => i.type === "item");
  const itemInstructions = recipe.instructions.filter((i) => i.type === "item");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {recipe.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          {recipe.description ? (
            <Text style={styles.description}>{recipe.description}</Text>
          ) : null}

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            {recipe.prepTime != null && recipe.prepTime > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{recipe.prepTime} min</Text>
                <Text style={styles.statLabel}>Prep</Text>
              </View>
            )}
            {recipe.cookTime != null && recipe.cookTime > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{recipe.cookTime} min</Text>
                <Text style={styles.statLabel}>Cook</Text>
              </View>
            )}
            {recipe.servings != null && recipe.servings > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{recipe.servings}</Text>
                <Text style={styles.statLabel}>Servings</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {recipe.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Ingredients ({itemIngredients.length})
            </Text>
            {recipe.ingredients.map((item, index) => {
              if (item.type === "header") {
                return (
                  <View key={`ing-h-${index}`} style={styles.subsectionHeader}>
                    <Text style={styles.subsectionHeaderText}>{item.text}</Text>
                  </View>
                );
              }
              return (
                <View key={`ing-${index}`} style={styles.ingredientRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.ingredientText}>{item.text}</Text>
                </View>
              );
            })}
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Instructions ({itemInstructions.length} steps)
            </Text>
            {(() => {
              let stepNum = 0;
              return recipe.instructions.map((item, index) => {
                if (item.type === "header") {
                  return (
                    <View
                      key={`ins-h-${index}`}
                      style={styles.subsectionHeader}
                    >
                      <Text style={styles.subsectionHeaderText}>
                        {item.text}
                      </Text>
                    </View>
                  );
                }
                stepNum++;
                return (
                  <View key={`ins-${index}`} style={styles.instructionRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{stepNum}</Text>
                    </View>
                    <Text style={styles.instructionText}>{item.text}</Text>
                  </View>
                );
              });
            })()}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => onSave(recipe)}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>Save to DishList</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: "center",
    marginHorizontal: theme.spacing.md,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing["4xl"],
  },
  description: {
    ...typography.body,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    ...typography.caption,
    fontFamily: "Inter-Medium",
    color: theme.colors.neutral[800],
  },
  statLabel: {
    ...typography.caption,
    fontSize: 11,
    color: theme.colors.neutral[500],
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: theme.spacing.xl,
  },
  tag: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    ...typography.caption,
    fontSize: 12,
    color: theme.colors.primary[600],
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  subsectionHeader: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  subsectionHeaderText: {
    ...typography.caption,
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: theme.colors.primary[600],
    fontWeight: "600",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    gap: theme.spacing.md,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.neutral[400],
    marginTop: 7,
  },
  ingredientText: {
    ...typography.body,
    color: theme.colors.neutral[800],
    flex: 1,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.neutral[200],
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumberText: {
    ...typography.caption,
    fontFamily: "Inter-Medium",
    fontSize: 13,
    color: theme.colors.primary[600],
  },
  instructionText: {
    ...typography.body,
    color: theme.colors.neutral[800],
    flex: 1,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  saveButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonText: {
    ...typography.button,
    color: "#FFFFFF",
    fontSize: 16,
  },
});
