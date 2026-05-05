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
import { ChevronLeft, X, Camera, AlertCircle, Plus } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import Button from "@components/ui/Button";
import { uploadImage } from "@services/image";
import { useCreateRecipe, useUpdateRecipe } from "../hooks";
import { NutritionSection, TagInput, DraggableRecipeList } from "../components";
import type { NutritionInfo, RecipeItem } from "../types";
import {
  convertLegacyToStructured,
  hasAtLeastOneItem,
  cleanEmptyItems,
  extractItemTexts,
} from "../types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "AddRecipe">;
const MAX_RECIPE_PHOTOS = 4;

const isRemoteImageUri = (uri: string) => /^https?:\/\//i.test(uri);

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
    editRecipe?.title || importedRecipe?.title || "",
  );
  const [prepTime, setPrepTime] = useState(
    editRecipe?.prepTime || importedRecipe?.prepTime || 0,
  );
  const [cookTime, setCookTime] = useState(
    editRecipe?.cookTime || importedRecipe?.cookTime || 0,
  );
  const [servings, setServings] = useState(
    editRecipe?.servings || importedRecipe?.servings || 0,
  );

  const [ingredients, setIngredients] = useState<RecipeItem[]>(() => {
    if ((editRecipe?.ingredients?.length ?? 0) > 0) {
      return convertLegacyToStructured(editRecipe!.ingredients!);
    }
    if ((importedRecipe?.ingredients?.length ?? 0) > 0) {
      return convertLegacyToStructured(importedRecipe!.ingredients!);
    }
    return [{ type: "item", text: "" }];
  });

  const [instructions, setInstructions] = useState<RecipeItem[]>(() => {
    if ((editRecipe?.instructions?.length ?? 0) > 0) {
      return convertLegacyToStructured(editRecipe!.instructions!);
    }
    if ((importedRecipe?.instructions?.length ?? 0) > 0) {
      return convertLegacyToStructured(importedRecipe!.instructions!);
    }
    return [{ type: "item", text: "" }];
  });

  const [imageUris, setImageUris] = useState<string[]>(() => {
    if (editRecipe?.imageUrls?.length) {
      return editRecipe.imageUrls.slice(0, MAX_RECIPE_PHOTOS);
    }
    return editRecipe?.imageUrl ? [editRecipe.imageUrl] : [];
  });
  const [imagesChanged, setImagesChanged] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [calculatedNutrition, setCalculatedNutrition] =
    useState<NutritionInfo | null>(editRecipe?.nutrition || null);
  const [originalIngredients] = useState<RecipeItem[]>(() =>
    editRecipe?.ingredients
      ? convertLegacyToStructured(editRecipe.ingredients)
      : [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warningsDismissed, setWarningsDismissed] = useState(false);
  const [tags, setTags] = useState<string[]>(editRecipe?.tags || []);
  const [notes, setNotes] = useState<string[]>(() =>
    editRecipe?.notes?.length ? editRecipe.notes : [""],
  );

  // Mutations
  const createRecipeMutation = useCreateRecipe();
  const updateRecipeMutation = useUpdateRecipe();

  // Check if ingredients changed (for nutrition clearing)
  const ingredientsChanged = useMemo(() => {
    if (!isEditMode) return false;
    return JSON.stringify(ingredients) !== JSON.stringify(originalIngredients);
  }, [ingredients, originalIngredients, isEditMode]);

  // Image handling
  const pickImage = async () => {
    if (imageUris.length >= MAX_RECIPE_PHOTOS) {
      Alert.alert(
        "Photo Limit",
        `You can add up to ${MAX_RECIPE_PHOTOS} photos per recipe.`,
      );
      return;
    }

    Alert.alert("Add Photos", "Choose how you want to add photos", [
      { text: "Cancel", style: "cancel" },
      { text: "Camera", onPress: openCamera },
      { text: "Photo Library", onPress: openImagePicker },
    ]);
  };

  const openCamera = async () => {
    if (imageUris.length >= MAX_RECIPE_PHOTOS) return;

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Camera permission is needed to take photos.",
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
      setImageUris((current) =>
        [...current, result.assets[0].uri].slice(0, MAX_RECIPE_PHOTOS),
      );
      setImagesChanged(true);
    }
  };

  const openImagePicker = async () => {
    const remainingSlots = MAX_RECIPE_PHOTOS - imageUris.length;
    if (remainingSlots <= 0) return;

    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Photo library access is needed to select images.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedUris = result.assets.map((asset) => asset.uri);
      setImageUris((current) =>
        [...current, ...selectedUris].slice(0, MAX_RECIPE_PHOTOS),
      );
      setImagesChanged(true);
    }
  };

  const removeImage = (index: number) => {
    setImageUris((current) => current.filter((_, i) => i !== index));
    setImagesChanged(true);
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!hasAtLeastOneItem(ingredients)) {
      newErrors.ingredients = "At least one ingredient is required";
    }

    if (!hasAtLeastOneItem(instructions)) {
      newErrors.instructions = "At least one instruction is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save handler
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      let finalImageUrls = imageUris;

      // Upload newly selected local photos if changed.
      if (imagesChanged && imageUris.length > 0) {
        setImageUploading(true);
        finalImageUrls = await Promise.all(
          imageUris.map((uri) =>
            isRemoteImageUri(uri) ? uri : uploadImage(uri, "recipes"),
          ),
        );
        setImageUploading(false);
      }

      const finalImageUrl = finalImageUrls[0] || null;

      const validIngredients = cleanEmptyItems(ingredients);
      const validInstructions = cleanEmptyItems(instructions);
      const validNotes = notes.map((note) => note.trim()).filter(Boolean);

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
        imageUrls: finalImageUrls,
        nutrition: nutritionData || undefined,
        notes: validNotes,
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
      ingredients.some((item) => item.text.trim()) ||
      instructions.some((item) => item.text.trim()) ||
      notes.some((note) => note.trim()) ||
      imagesChanged;

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
        ],
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
            <DraggableRecipeList
              items={ingredients}
              onItemsChange={setIngredients}
              type="ingredients"
              error={errors.ingredients}
            />

            {/* Instructions */}
            <DraggableRecipeList
              items={instructions}
              onItemsChange={setInstructions}
              type="instructions"
              error={errors.instructions}
            />

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
              ingredients={extractItemTexts(ingredients)}
              servings={servings}
              onNutritionCalculated={setCalculatedNutrition}
            />

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes (Optional)</Text>
              {notes.map((note, index) => (
                <View key={index} style={styles.noteInputRow}>
                  <TextInput
                    style={styles.noteInput}
                    placeholder={`Note ${index + 1}`}
                    placeholderTextColor={theme.colors.neutral[400]}
                    value={note}
                    onChangeText={(text) =>
                      setNotes((current) =>
                        current.map((currentNote, currentIndex) =>
                          currentIndex === index ? text : currentNote,
                        ),
                      )
                    }
                    multiline
                    textAlignVertical="top"
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      setNotes((current) =>
                        current.length === 1
                          ? [""]
                          : current.filter(
                              (_, currentIndex) => currentIndex !== index,
                            ),
                      )
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={16} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setNotes((current) => [...current, ""])}
              >
                <Text style={styles.addButtonText}>Add Note</Text>
              </TouchableOpacity>
            </View>

            {/* Recipe Images */}
            <View style={styles.section}>
              <View style={styles.photoSectionHeader}>
                <Text style={[styles.sectionTitle, styles.photoSectionTitle]}>
                  Recipe Photos
                </Text>
                <Text style={styles.photoCount}>
                  {imageUris.length}/{MAX_RECIPE_PHOTOS}
                </Text>
              </View>
              <View style={styles.photoGrid}>
                {imageUris.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.photoTile}>
                    <Image source={{ uri }} style={styles.selectedImage} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removeImage(index)}
                      accessibilityLabel={`Remove photo ${index + 1}`}
                    >
                      <X size={14} color="white" />
                    </TouchableOpacity>
                    <View style={styles.photoIndexPill}>
                      <Text style={styles.photoIndexText}>{index + 1}</Text>
                    </View>
                  </View>
                ))}
                {imageUris.length < MAX_RECIPE_PHOTOS && (
                  <TouchableOpacity
                    style={[styles.photoTile, styles.addPhotoTile]}
                    onPress={pickImage}
                  >
                    {imageUris.length === 0 ? (
                      <Camera size={32} color={theme.colors.neutral[400]} />
                    ) : (
                      <Plus size={28} color={theme.colors.primary[500]} />
                    )}
                    <Text style={styles.imagePickerText}>Add Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Tags */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags (Optional)</Text>
              <TagInput tags={tags} onTagsChange={setTags} />
            </View>

            {/* Save Button */}
            <Button
              title={isEditMode ? "Update Recipe" : "Add Recipe"}
              onPress={handleSave}
              loading={isLoading}
              disabled={isLoading}
              style={styles.saveButton}
            />
          </ScrollView>
        </View>
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
  noteInputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  noteInput: {
    ...typography.body,
    flex: 1,
    minHeight: 72,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.neutral[800],
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
  photoSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  photoCount: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
  photoSectionTitle: {
    marginBottom: 0,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  photoTile: {
    width: "47%",
    aspectRatio: 4 / 3,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    backgroundColor: theme.colors.neutral[100],
  },
  addPhotoTile: {
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  removePhotoButton: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoIndexPill: {
    position: "absolute",
    left: theme.spacing.sm,
    bottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  photoIndexText: {
    ...typography.caption,
    color: "white",
    fontWeight: "700",
  },
  imagePickerText: {
    ...typography.body,
    color: theme.colors.neutral[400],
    marginTop: theme.spacing.sm,
  },
  saveButton: {
    width: "100%",
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
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
