import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Calculator } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";
import { calculateNutrition } from "../../services/nutrition";
import NutritionFacts from "./NutritionFacts";

interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  sugar?: number;
  fat?: number;
}

interface NutritionSectionProps {
  nutrition?: NutritionInfo | null;
  ingredients?: string[];
  servings: number;
  recipeId?: string;
  onNutritionCalculated?: (nutritionData: NutritionInfo) => void;
}

export default function NutritionSection({
  nutrition,
  ingredients = [],
  servings,
  recipeId,
  onNutritionCalculated,
}: NutritionSectionProps) {
  const [calculatedNutrition, setCalculatedNutrition] = useState<NutritionInfo | null>(
    nutrition || null
  );

  // Calculate nutrition mutation
  const calculateNutritionMutation = useMutation({
    mutationFn: async () => {
      if (!ingredients || ingredients.length === 0) {
        throw new Error("Missing ingredients");
      }
      return calculateNutrition(ingredients, servings);
    },
    onSuccess: (nutritionData) => {
      setCalculatedNutrition(nutritionData);
      onNutritionCalculated?.(nutritionData);
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to calculate nutrition. Please try again.");
    },
  });

  const handleCalculateNutrition = () => {
    if (!ingredients || ingredients.length === 0) {
      Alert.alert(
        "No Ingredients",
        "This recipe needs ingredients to calculate nutrition."
      );
      return;
    }

    calculateNutritionMutation.mutate();
  };

  // Use calculated nutrition if available, otherwise use prop nutrition
  const displayNutrition = calculatedNutrition || nutrition;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Nutrition Information</Text>
      
      {displayNutrition ? (
        <NutritionFacts 
          nutrition={displayNutrition}
          servings={servings}
        />
      ) : (
        <View style={styles.nutritionContainer}>
          <Text style={styles.nutritionDescription}>
            Get detailed nutrition facts for this recipe based on its ingredients.
          </Text>
          
          <TouchableOpacity
            style={[
              styles.nutritionButton,
              calculateNutritionMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={handleCalculateNutrition}
            disabled={calculateNutritionMutation.isPending}
          >
            {calculateNutritionMutation.isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Calculator size={20} color="white" />
                <Text style={styles.nutritionButtonText}>
                  Calculate Nutrition
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing["3xl"],
  },
  sectionTitle: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  nutritionContainer: {
    gap: theme.spacing.md,
  },
  nutritionDescription: {
    ...typography.caption,
    color: theme.colors.neutral[600],
    fontSize: 13,
    lineHeight: 18,
  },
  nutritionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary[500],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  nutritionButtonText: {
    ...typography.button,
    color: "white",
  },
});