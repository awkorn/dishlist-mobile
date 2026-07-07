import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Alert } from "react-native";
import { recipeService } from "../services";
import { getErrorMessage } from "@utils";
import type { ImageData, ImportRecipeResponse } from "../types";

interface UseImportRecipeOptions {
  maxImages?: number;
  onSuccess?: (data: ImportRecipeResponse) => void;
  onError?: (error: Error) => void;
}

interface UseImportRecipeReturn {
  // State
  selectedImages: ImageData[];
  isProcessing: boolean;
  processingStatus: string;

  // Actions
  pickFromLibrary: () => Promise<void>;
  takePhoto: () => Promise<void>;
  removeImage: (index: number) => void;
  clearImages: () => void;
  processImages: () => Promise<ImportRecipeResponse | null>;
  showImageSourcePicker: () => void;
}

const MAX_IMAGES = 5;
// Long-edge cap for imported photos. gpt-4o vision downscales large images
// anyway, so this only trims payload size, not extraction quality.
const MAX_IMPORT_DIMENSION = 1568;

export function useImportRecipe(
  options: UseImportRecipeOptions = {}
): UseImportRecipeReturn {
  const { maxImages = MAX_IMAGES, onSuccess, onError } = options;

  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  // Request camera permission
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Camera permission is needed to take photos of recipes."
      );
      return false;
    }
    return true;
  };

  // Request media library permission
  const requestMediaPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Photo library access is needed to select recipe images."
      );
      return false;
    }
    return true;
  };

  // Downscale + re-encode the image to JPEG base64 before upload. Resizing the
  // long edge to <= MAX_IMPORT_DIMENSION keeps multi-photo payloads well under
  // the API body limit (and the server-side per-image cap), and normalizing to
  // JPEG guarantees an allowlisted mimeType regardless of the source format.
  const imageToBase64 = async (
    uri: string
  ): Promise<{ base64: string; mimeType: string }> => {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: MAX_IMPORT_DIMENSION } }],
      {
        base64: true,
        compress: 0.7,
        format: SaveFormat.JPEG,
      }
    );

    if (!result.base64) {
      throw new Error("Failed to prepare image for import");
    }

    return { base64: result.base64, mimeType: "image/jpeg" };
  };

  // Process picked images
  const processPickedImages = useCallback(
    async (assets: ImagePicker.ImagePickerAsset[]): Promise<void> => {
      const remainingSlots = maxImages - selectedImages.length;
      const imagesToAdd = assets.slice(0, remainingSlots);

      if (assets.length > remainingSlots) {
        Alert.alert(
          "Image Limit",
          `Only ${remainingSlots} more image(s) can be added. Maximum is ${maxImages}.`
        );
      }

      const newImages: ImageData[] = await Promise.all(
        imagesToAdd.map(async (asset) => {
          const { base64, mimeType } = await imageToBase64(asset.uri);
          return {
            uri: asset.uri,
            base64,
            mimeType,
          };
        })
      );

      setSelectedImages((prev) => [...prev, ...newImages]);
    },
    [maxImages, selectedImages.length]
  );

  // Pick images from library
  const pickFromLibrary = useCallback(async (): Promise<void> => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    const remainingSlots = maxImages - selectedImages.length;
    if (remainingSlots <= 0) {
      Alert.alert("Image Limit", `Maximum ${maxImages} images allowed.`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
        base64: false, // We'll convert manually for more control
      });

      if (!result.canceled && result.assets.length > 0) {
        await processPickedImages(result.assets);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to select images. Please try again.");
    }
  }, [maxImages, selectedImages.length, processPickedImages]);

  // Take photo with camera
  const takePhoto = useCallback(async (): Promise<void> => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    if (selectedImages.length >= maxImages) {
      Alert.alert("Image Limit", `Maximum ${maxImages} images allowed.`);
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        await processPickedImages(result.assets);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  }, [maxImages, selectedImages.length, processPickedImages]);

  // Remove image at index
  const removeImage = useCallback((index: number): void => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all images
  const clearImages = useCallback((): void => {
    setSelectedImages([]);
  }, []);

  // Process images with AI
  const processImages =
    useCallback(async (): Promise<ImportRecipeResponse | null> => {
      if (selectedImages.length === 0) {
        Alert.alert("No Images", "Please select at least one image.");
        return null;
      }

      setIsProcessing(true);
      setProcessingStatus("Uploading images...");

      try {
        setProcessingStatus("Analyzing recipe...");

        const response = await recipeService.importFromImages(selectedImages);

        setProcessingStatus("Complete!");
        onSuccess?.(response);

        return response;
      } catch (error) {
        console.error("Error processing images:", error);
        const err =
          error instanceof Error
            ? error
            : new Error("Failed to process images");
        onError?.(err);
        Alert.alert(
          "Error",
          getErrorMessage(
            error,
            "Failed to extract recipe from images. Please try again."
          )
        );
        return null;
      } finally {
        setIsProcessing(false);
        setProcessingStatus("");
      }
    }, [selectedImages, onSuccess, onError]);

  // Show action sheet for image source selection
  const showImageSourcePicker = useCallback((): void => {
    Alert.alert("Add Recipe Photo", "Choose how to add your recipe image", [
      { text: "Cancel", style: "cancel" },
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Library", onPress: pickFromLibrary },
    ]);
  }, [takePhoto, pickFromLibrary]);

  return {
    selectedImages,
    isProcessing,
    processingStatus,
    pickFromLibrary,
    takePhoto,
    removeImage,
    clearImages,
    processImages,
    showImageSourcePicker,
  };
}
