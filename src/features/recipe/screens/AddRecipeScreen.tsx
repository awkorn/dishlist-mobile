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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, X, Camera, AlertCircle } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import Button from "@components/ui/Button";
import { uploadImage } from "@services/image";
import { useCreateRecipe, useUpdateRecipe } from "../hooks";
import { NutritionSection, TagInput } from "../components";
import type { NutritionInfo } from "../types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "AddRecipe">;

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

export default function AddRecipeScreen({ route, navigation }: Props) {
  const {
    dishListId,
    recipeId,
    recipe: editRecipe,
    importedRecipe,
    importWarnings,
  } = route.params;

  const isEditMode = !!recipeId && !!editRecipe;
  const isImportMode = !!importedRecipe && !isEditMode;

  // Form state
  const [title, setTitle] = useState(
    editRecipe?.title || importedRecipe?.title || ""
  );
  const [prepTime, setPrepTime] = useState(
    editRecipe?.prepTime || importedRecipe?.prepTime || 0
  );
  const [cookTime, setCookTime] = useState(
    editRecipe?.cookTime || importedRecipe?.cookTime || 0
  );
  const [servings, setServings] = useState(
    editRecipe?.servings || importedRecipe?.servings || 1
  );
  const [ingredients, setIngredients] = useState<string[]>(
    (editRecipe?.ingredients?.length ?? 0) > 0
      ? editRecipe!.ingredients
      : (importedRecipe?.ingredients?.length ?? 0) > 0
      ? importedRecipe!.ingredients
      : [""]
  );
  const [instructions, setInstructions] = useState<string[]>(
    (editRecipe?.instructions?.length ?? 0) > 0
      ? editRecipe!.instructions
      : (importedRecipe?.instructions?.length ?? 0) > 0
      ? importedRecipe!.instructions
      : [""]
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
  const [warningsDismissed, setWarningsDismissed] = useState(false);
  const [tags, setTags] = useState<string[]>(editRecipe?.tags || []);

  // Mutations
  const createRecipeMutation = useCreateRecipe();
  const updateRecipeMutation = useUpdateRecipe();

  // Check if ingredients changed (for nutrition clearing)
  const ingredientsChanged = useMemo(() => {
    if (!isEditMode) return false;
    return JSON.stringify(ingredients) !== JSON.stringify(originalIngredients);
  }, [ingredients, originalIngredients, isEditMode]);

  // Ingredient management
  const addIngredient = () => setIngredients([...ingredients, ""]);

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
  const addInstruction = () => setInstructions([...instructions, ""]);

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
      { text: "Camera", onPress: openCamera },
      { text: "Photo Library", onPress: openImagePicker },
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
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const openImagePicker = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Photo library access is needed to select images."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
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

  // Save handler
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      let finalImageUrl = isEditMode ? editRecipe?.imageUrl : null;

      // Upload image if changed
      if (imageChanged && imageUri) {
        setImageUploading(true);
        finalImageUrl = await uploadImage(imageUri, "recipes");
        setImageUploading(false);
      }

      const validIngredients = ingredients.filter((ing) => ing.trim());
      const validInstructions = instructions.filter((inst) => inst.trim());

      // Clear nutrition if ingredients changed
      const nutritionData = ingredientsChanged ? null : calculatedNutrition;

      const recipeData = {
        title: title.trim(),
        ingredients: validIngredients,
        instructions: validInstructions,
        prepTime: prepTime > 0 ? prepTime : undefined,
        cookTime: cookTime > 0 ? cookTime : undefined,
        servings: servings > 0 ? servings : undefined,
        imageUrl: finalImageUrl,
        nutrition: nutritionData || undefined,
        tags: tags,
      };

      if (isEditMode && recipeId) {
        await updateRecipeMutation.mutateAsync({
          recipeId,
          data: recipeData,
        });
        navigation.goBack();
      } else {
        await createRecipeMutation.mutateAsync({
          ...recipeData,
          dishListId,
        });
        navigation.goBack();
      }
    } catch (error) {
      setImageUploading(false);
      console.error("Save recipe error:", error);
    }
  };

  // Cancel handler
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

  const ImportWarningBanner = () => {
    if (!isImportMode || !importWarnings?.length || warningsDismissed) {
      return null;
    }

    return (
      <View style={styles.warningBanner}>
        <View style={styles.warningHeader}>
          <AlertCircle size={20} color={theme.colors.warning} />
          <Text style={styles.warningTitle}>Import Notes</Text>
          <TouchableOpacity onPress={() => setWarningsDismissed(true)}>
            <X size={18} color={theme.colors.warning} />
          </TouchableOpacity>
        </View>
        <Text style={styles.warningText}>
          Some details couldn't be extracted automatically:
        </Text>
        {importWarnings.map((warning, index) => (
          <Text key={index} style={styles.warningItem}>
            • {warning}
          </Text>
        ))}
        <Text style={styles.warningHint}>
          Please review and fill in any missing information.
        </Text>
      </View>
    );
  };

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
              {isEditMode
                ? "Edit Recipe"
                : isImportMode
                ? "Review Imported Recipe"
                : "Add Recipe"}
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
              <Text style={styles.sectionTitle}>Title</Text>
              <TextInput
                style={[styles.titleInput, errors.title && styles.inputError]}
                placeholder="Recipe title"
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
                    placeholder={`Ingredient ${index + 1}`}
                    placeholderTextColor={theme.colors.neutral[400]}
                    value={ingredient}
                    onChangeText={(value) => updateIngredient(index, value)}
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
              onNutritionCalculated={setCalculatedNutrition}
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

            {/* Tags */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags (Optional)</Text>
              <TagInput tags={tags} onTagsChange={setTags} />
            </View>
          </ScrollView>
        </View>

        {/* Footer */}
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  main: {
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
    gap: theme.spacing.md,
  },
  timeInputContainer: {
    flex: 1,
    alignItems: "center",
  },
  timeLabel: {
    ...typography.caption,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.xs,
  },
  timeInput: {
    ...typography.body,
    width: "100%",
    textAlign: "center",
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  timeUnit: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing.xs,
  },
  dynamicInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dynamicInput: {
    ...typography.body,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  instructionInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  removeButton: {
    padding: theme.spacing.sm,
  },
  addButton: {
    alignItems: "center",
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.md,
    borderStyle: "dashed",
  },
  addButtonText: {
    ...typography.button,
    color: theme.colors.primary[500],
  },
  nutritionWarning: {
    backgroundColor: theme.colors.warning + "20",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  nutritionWarningText: {
    ...typography.caption,
    color: theme.colors.warning,
  },
  imagePickerButton: {
    width: "100%",
    height: 200,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.neutral[100],
  },
  imagePickerText: {
    ...typography.body,
    color: theme.colors.neutral[400],
    marginTop: theme.spacing.sm,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  saveButton: {
    width: "100%",
    paddingVertical: theme.spacing.lg,
  },
  warningBanner: {
    backgroundColor: theme.colors.warning + "15",
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  warningTitle: {
    ...typography.subtitle,
    color: theme.colors.warning,
    flex: 1,
  },
  warningText: {
    ...typography.body,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.xs,
  },
  warningItem: {
    ...typography.caption,
    color: theme.colors.neutral[600],
    marginLeft: theme.spacing.sm,
    marginBottom: 2,
  },
  warningHint: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing.sm,
    fontStyle: "italic",
  },
});
