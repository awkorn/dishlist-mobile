import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";

interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  sugar?: number;
  fat?: number;
}

interface NutritionFactsProps {
  nutrition: NutritionInfo;
  servings: number;
  expanded?: boolean;
}

interface MacroBarProps {
  protein: number;
  carbs: number;
  fat: number;
}

const MacroBar: React.FC<MacroBarProps> = ({ protein, carbs, fat }) => {
  if (protein === 0 && carbs === 0 && fat === 0) return null;

  // Calculate calories from each macro
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatCals = fat * 9;

  const totalCals = proteinCals + carbsCals + fatCals;

  // Calculate percentages with minimum width enforcement
  const totalPercent = 100;
  const minPercent = 2; // Minimum percentage for visibility
  let proteinPercent = totalCals > 0 ? (proteinCals / totalCals) * 100 : 0;
  let carbsPercent = totalCals > 0 ? (carbsCals / totalCals) * 100 : 0;
  let fatPercent = totalCals > 0 ? (fatCals / totalCals) * 100 : 0;

  // Ensure minimum width for visible macros
  const visibleMacros = [proteinPercent, carbsPercent, fatPercent].filter(
    (p) => p > 0
  ).length;
  if (visibleMacros > 1) {
    if (proteinPercent > 0 && proteinPercent < minPercent)
      proteinPercent = minPercent;
    if (carbsPercent > 0 && carbsPercent < minPercent)
      carbsPercent = minPercent;
    if (fatPercent > 0 && fatPercent < minPercent) fatPercent = minPercent;

    // Normalize percentages to maintain total of 100%
    const sumPercent = proteinPercent + carbsPercent + fatPercent;
    if (sumPercent !== totalPercent) {
      const scale = totalPercent / sumPercent;
      proteinPercent *= scale;
      carbsPercent *= scale;
      fatPercent *= scale;
    }
  }

  const proteinWidth = new Animated.Value(0);
  const carbsWidth = new Animated.Value(0);
  const fatWidth = new Animated.Value(0);

  React.useEffect(() => {
    const animateBar = (
      animatedValue: Animated.Value,
      toValue: number,
      delay: number
    ) => {
      setTimeout(() => {
        Animated.timing(animatedValue, {
          toValue,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }, delay);
    };

    animateBar(proteinWidth, proteinPercent, 0);
    animateBar(carbsWidth, carbsPercent, 200);
    animateBar(fatWidth, fatPercent, 400);
  }, [proteinPercent, carbsPercent, fatPercent]);

  return (
    <View style={styles.macroBarContainer}>
      <View style={styles.macroBar}>
        {proteinPercent > 0 && (
          <Animated.View
            style={[
              styles.macroFill,
              styles.proteinFill,
              {
                width: proteinWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          >
            {proteinPercent > 10 && (
              <Text
                style={[
                  styles.macroText,
                  { fontSize: proteinPercent < 15 ? 8 : 10 },
                ]}
              >
                {Math.round(protein)}g
              </Text>
            )}
          </Animated.View>
        )}

        {carbsPercent > 0 && (
          <Animated.View
            style={[
              styles.macroFill,
              styles.carbsFill,
              {
                width: carbsWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          >
            {carbsPercent > 10 && (
              <Text
                style={[
                  styles.macroText,
                  { fontSize: carbsPercent < 15 ? 8 : 10 },
                ]}
              >
                {Math.round(carbs)}g
              </Text>
            )}
          </Animated.View>
        )}

        {fatPercent > 0 && (
          <Animated.View
            style={[
              styles.macroFill,
              styles.fatFill,
              {
                width: fatWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          >
            {fatPercent > 10 && (
              <Text
                style={[
                  styles.macroText,
                  { fontSize: fatPercent < 15 ? 8 : 10 },
                ]}
              >
                {Math.round(fat)}g
              </Text>
            )}
          </Animated.View>
        )}
      </View>

      <View style={styles.macroLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.proteinFill]} />
          <Text style={styles.legendText}>
            Protein
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.carbsFill]} />
          <Text style={styles.legendText}>
            Carbs
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.fatFill]} />
          <Text style={styles.legendText}>
            Fat
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function NutritionFacts({
  nutrition,
  servings,
  expanded = false,
}: NutritionFactsProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [rotateAnimation] = useState(new Animated.Value(expanded ? 1 : 0));

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    Animated.timing(rotateAnimation, {
      toValue: newExpanded ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const rotateInterpolation = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const {
    calories = 0,
    protein = 0,
    carbs = 0,
    sugar = 0,
    fat = 0,
  } = nutrition;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleExpanded} style={styles.header}>
        <Text style={styles.title}>Nutrition Facts</Text>
        <Animated.View style={{ transform: [{ rotate: rotateInterpolation }] }}>
          <ChevronDown size={16} color={theme.colors.neutral[600]} />
        </Animated.View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <Text style={styles.servingInfo}>
            Per serving ({servings} {servings === 1 ? "serving" : "servings"})
          </Text>

          <View style={styles.caloriesSection}>
            <View style={styles.nutrientRow}>
              <Text style={styles.caloriesLabel}>Calories</Text>
              <Text style={styles.caloriesValue}>{calories}</Text>
            </View>
          </View>

          <MacroBar protein={protein} carbs={carbs} fat={fat} />

          <View style={styles.detailsSection}>
            <View style={styles.nutrientRow}>
              <Text style={styles.nutrientName}>Protein</Text>
              <Text style={styles.nutrientValue}>{protein}g</Text>
            </View>

            <View style={styles.nutrientRow}>
              <Text style={styles.nutrientName}>Total Carbohydrates</Text>
              <Text style={styles.nutrientValue}>{carbs}g</Text>
            </View>

            <View style={[styles.nutrientRow, styles.indented]}>
              <Text style={styles.nutrientName}>Sugars</Text>
              <Text style={styles.nutrientValue}>{sugar}g</Text>
            </View>

            <View style={styles.nutrientRow}>
              <Text style={styles.nutrientName}>Total Fat</Text>
              <Text style={styles.nutrientValue}>{fat}g</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.neutral[800],
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.neutral[800],
    backgroundColor: theme.colors.surface,
  },
  title: {
    ...typography.subtitle,
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.neutral[800],
    letterSpacing: 0.5,
  },
  content: {
    padding: theme.spacing.lg,
  },
  servingInfo: {
    ...typography.caption,
    fontSize: 12,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.neutral[800],
  },
  caloriesSection: {
    marginBottom: theme.spacing.lg,
  },
  caloriesLabel: {
    ...typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.neutral[800],
  },
  caloriesValue: {
    ...typography.body,
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.neutral[800],
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  nutrientName: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.neutral[700],
  },
  nutrientValue: {
    ...typography.body,
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.neutral[800],
  },
  indented: {
    paddingLeft: theme.spacing.lg,
  },
  detailsSection: {
    marginTop: theme.spacing.sm,
  },

  // Macro Bar Styles
  macroBarContainer: {
    marginVertical: theme.spacing.lg,
  },
  macroBar: {
    height: 28,
    flexDirection: "row",
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
  },
  macroFill: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: theme.colors.neutral[300],
  },
  macroText: {
    color: "white",
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  proteinFill: {
    backgroundColor: "#4CAF50",
  },
  carbsFill: {
    backgroundColor: "#2196F3",
  },
  fatFill: {
    backgroundColor: "#FF9800",
  },
  macroLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.caption,
    fontSize: 11,
    color: theme.colors.neutral[600],
    fontWeight: "500",
  },
});
