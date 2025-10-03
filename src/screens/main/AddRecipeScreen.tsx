import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, X, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { theme } from "../../styles/theme";
import { typography } from "../../styles/typography";
import Button from "../../components/ui/Button";
import { createRecipe } from "../../services/api";
import { useUpdateRecipe } from "../../hooks/mutations/useRecipeMutations";
import { uploadImage } from "../../services/firebase";
import { queryKeys } from "../../lib/queryKeys";
import NutritionFacts from "../../components/recipe/NutritionFacts";
import NutritionSection from "../../components/recipe/NutritionSection";

interface AddRecipeScreenProps {
  route: {
    params: {
      dishListId: string;
      recipeId?: string;
      recipe?: any;
    };
  };
  navigation: any;
}

interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  sugar?: number;
  fat?: number;
}

interface TimeInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
}

const TimeInput: React.FC<TimeInputProps> = ({
  label,
  value,
  onChange,
  unit,
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleTextChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "");
    setInputValue(numericText);
    const numValue = parseInt(numericText) || 0;
    onChange(Math.max(0, numValue));
  };

  const handleEndEditing = () => {
    const numValue = parseInt(inputValue) || 0;
    const validValue = Math.max(0, numValue);
    setInputValue(validValue.toString());
    onChange(validValue);
  };

  return (
    <View style={styles.timeInputContainer}>
      <Text style={styles.timeLabel}>{label}</Text>
      <TextInput
        style={styles.timeInput}
        value={inputValue}
        onChangeText={handleTextChange}
        onEndEditing={handleEndEditing}
        keyboardType="number-pad"
        returnKeyType="done"
        maxLength={3}
        selectTextOnFocus
        placeholder="0"
      />
      <Text style={styles.timeUnit}>{unit}</Text>
    </View>
  );
};

export default function AddRecipeScreen({
  route,
  navigation,
}: AddRecipeScreenProps) {
  const { dishListId, recipeId, recipe: editRecipe } = route.params;
  const isEditMode = !!recipeId && !!editRecipe;
  const queryClient = useQueryClient();

  // Form state - initialize with edit data if available
  const [title, setTitle] = useState(editRecipe?.title || "");
  const [prepTime, setPrepTime] = useState(editRecipe?.prepTime || 0);
  const [cookTime, setCookTime] = useState(editRecipe?.cookTime || 0);
  const [servings, setServings] = useState(editRecipe?.servings || 1);
  const [ingredients, setIngredients] = useState<string[]>(
    editRecipe?.ingredients?.length > 0 ? editRecipe.ingredients : [""]
  );
  const [instructions, setInstructions] = useState<string[]>(
    editRecipe?.instructions?.length > 0 ? editRecipe.instructions : [""]
  );
  const [imageUri, setImageUri] = useState<string | null>(
    editRecipe?.imageUrl || null
  );
  const [imageChanged, setImageChanged] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [calculatedNutrition, setCalculatedNutrition] =
    useState<NutritionInfo | null>(editRecipe?.nutrition || null);
  const [originalIngredients] = useState<string[]>(
    editRecipe?.ingredients || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalTime = useMemo(() => prepTime + cookTime, [prepTime, cookTime]);

  // Mutations
  const createRecipeMutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dishList", dishListId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dishLists.all });
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to create recipe"
      );
    },
  });

  const updateRecipeMutation = useUpdateRecipe();

  // Check if ingredients changed (for nutrition clearing)
  const ingredientsChanged = useMemo(() => {
    if (!isEditMode) return false;
    return JSON.stringify(ingredients) !== JSON.stringify(originalIngredients);
  }, [ingredients, originalIngredients, isEditMode]);

  // Ingredient management
  const addIngredient = () => {
    setIngredients([...ingredients, ""]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  // Instruction management
  const addInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  // Image handling
  const pickImage = async () => {
    Alert.alert("Select Image", "Choose how you want to add an image", [
      { text: "Cancel", style: "cancel" },
      { text: "Camera", onPress: () => openCamera() },
      { text: "Photo Library", onPress: () => openImagePicker() },
    ]);
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Camera permission is needed to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const openImagePicker = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Photo library permission is needed.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Recipe title is required";
    }

    const validIngredients = ingredients.filter((ing) => ing.trim());
    if (validIngredients.length === 0) {
      newErrors.ingredients = "At least one ingredient is required";
    }

    const validInstructions = instructions.filter((inst) => inst.trim());
    if (validInstructions.length === 0) {
      newErrors.instructions = "At least one instruction is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save recipe (create or update)
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      let finalImageUrl = imageUri;

      // Upload new image if changed
      if (imageChanged && imageUri && !imageUri.startsWith("http")) {
        setImageUploading(true);
        finalImageUrl = await uploadImage(imageUri, "recipes");
        setImageUploading(false);
      }

      const validIngredients = ingredients.filter((ing) => ing.trim());
      const validInstructions = instructions.filter((inst) => inst.trim());

      // Determine nutrition data
      let nutritionData = calculatedNutrition;
      if (isEditMode && ingredientsChanged) {
        // Clear nutrition if ingredients changed
        nutritionData = null;
      }

      const recipeData = {
        title: title.trim(),
        ingredients: validIngredients,
        instructions: validInstructions,
        prepTime: prepTime > 0 ? prepTime : undefined,
        cookTime: cookTime > 0 ? cookTime : undefined,
        servings: servings > 0 ? servings : undefined,
        imageUrl: finalImageUrl,
        nutrition: nutritionData,
      };

      if (isEditMode) {
        // Update existing recipe
        await updateRecipeMutation.mutateAsync({
          recipeId: recipeId!,
          data: recipeData,
        });
        navigation.goBack();
      } else {
        // Create new recipe
        await createRecipeMutation.mutateAsync({
          ...recipeData,
          dishListId,
        });
      }
    } catch (error) {
      setImageUploading(false);
      console.error("Save recipe error:", error);
    }
  };

  const handleCancel = () => {
    const hasChanges =
      title.trim() !== (editRecipe?.title || "") ||
      ingredients.some((ing) => ing.trim()) ||
      instructions.some((inst) => inst.trim()) ||
      imageChanged;

    if (hasChanges) {
      Alert.alert(
        isEditMode ? "Discard Changes?" : "Discard Recipe?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Keep Editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const isLoading =
    createRecipeMutation.isPending ||
    updateRecipeMutation.isPending ||
    imageUploading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.main}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <ChevronLeft size={24} color={theme.colors.neutral[700]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditMode ? "Edit Recipe" : "Add Recipe"}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Recipe Title */}
            <View style={styles.section}>
              <TextInput
                style={[styles.titleInput, errors.title && styles.inputError]}
                placeholder="Recipe Title"
                placeholderTextColor={theme.colors.neutral[400]}
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
                maxLength={100}
              />
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            {/* Time & Servings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time & Servings</Text>
              <View style={styles.timeSection}>
                <TimeInput
                  label="Prep Time"
                  value={prepTime}
                  onChange={setPrepTime}
                  unit="min"
                />
                <TimeInput
                  label="Cook Time"
                  value={cookTime}
                  onChange={setCookTime}
                  unit="min"
                />
                <TimeInput
                  label="Servings"
                  value={servings}
                  onChange={setServings}
                  unit=""
                />
              </View>
              <View style={styles.totalTimeContainer}>
                <Text style={styles.totalTimeLabel}>Total Time</Text>
                <Text style={styles.totalTimeValue}>{totalTime} min</Text>
              </View>
            </View>

            {/* Ingredients */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {errors.ingredients && (
                <Text style={styles.errorText}>{errors.ingredients}</Text>
              )}
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.dynamicInputRow}>
                  <TextInput
                    style={[styles.dynamicInput, { flex: 1 }]}
                    placeholder={`Ingredient`}
                    placeholderTextColor={theme.colors.neutral[400]}
                    value={ingredient}
                    onChangeText={(value) => updateIngredient(index, value)}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeIngredient(index)}
                  >
                    <X size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={addIngredient}
              >
                <Text style={styles.addButtonText}>Add Ingredient</Text>
              </TouchableOpacity>
            </View>

            {/* Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              {errors.instructions && (
                <Text style={styles.errorText}>{errors.instructions}</Text>
              )}
              {instructions.map((instruction, index) => (
                <View key={index} style={styles.dynamicInputRow}>
                  <TextInput
                    style={[
                      styles.dynamicInput,
                      styles.instructionInput,
                      { flex: 1 },
                    ]}
                    placeholder={`Step ${index + 1}`}
                    placeholderTextColor={theme.colors.neutral[400]}
                    value={instruction}
                    onChangeText={(value) => updateInstruction(index, value)}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeInstruction(index)}
                  >
                    <X size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={addInstruction}
              >
                <Text style={styles.addButtonText}>Add Step</Text>
              </TouchableOpacity>
            </View>

            {/* Nutrition */}
            {ingredientsChanged && calculatedNutrition && (
              <View style={styles.nutritionWarning}>
                <Text style={styles.nutritionWarningText}>
                  ⚠️ Ingredients changed - nutrition data will be cleared.
                  Recalculate after saving.
                </Text>
              </View>
            )}
            <NutritionSection
              nutrition={ingredientsChanged ? null : calculatedNutrition}
              ingredients={ingredients.filter((ing) => ing.trim())}
              servings={servings}
              onNutritionCalculated={(nutritionData) => {
                setCalculatedNutrition(nutritionData);
              }}
            />

            {/* Recipe Image */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recipe Image</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.selectedImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Camera size={32} color={theme.colors.neutral[400]} />
                    <Text style={styles.imagePickerText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Footer pinned to bottom */}
        <SafeAreaView edges={["bottom"]} style={styles.footer}>
          <Button
            title={isEditMode ? "Update Recipe" : "Add Recipe"}
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading}
            style={styles.saveButton}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing["3xl"],
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  titleInput: {
    ...typography.body,
    fontSize: 18,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.neutral[800],
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    ...typography.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  timeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg,
  },
  timeInputContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  timeLabel: {
    ...typography.caption,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  timeInput: {
    ...typography.body,
    textAlign: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.neutral[800],
    minHeight: 44,
  },
  timeUnit: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  totalTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  totalTimeLabel: {
    ...typography.body,
    color: theme.colors.primary[500],
    fontWeight: "600",
  },
  totalTimeValue: {
    ...typography.body,
    color: theme.colors.primary[600],
    fontWeight: "700",
  },
  dynamicInputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  dynamicInput: {
    ...typography.body,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.neutral[800],
    minHeight: 48,
  },
  instructionInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  removeButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  addButton: {
    backgroundColor: theme.colors.neutral[100],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.neutral[800],
    borderStyle: "dashed",
  },
  addButtonText: {
    ...typography.button,
    color: theme.colors.primary[600],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  imagePickerButton: {
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderStyle: "dashed",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.neutral[50],
    height: 150,
    gap: theme.spacing.sm,
  },
  imagePickerText: {
    ...typography.body,
    color: theme.colors.neutral[500],
  },
  selectedImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  nutritionWarning: {
    backgroundColor: "#FEF2F2",
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  nutritionWarningText: {
    ...typography.caption,
    color: "#991B1B",
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  saveButton: {
    width: "100%",
  },
});
