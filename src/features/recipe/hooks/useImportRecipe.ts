import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";
import { recipeService } from "../services";
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

  // Convert image URI to base64
  const imageToBase64 = async (
    uri: string
  ): Promise<{ base64: string; mimeType: string }> => {
    const file = new FileSystem.File(uri);
    const base64 = await file.base64();

    // Determine MIME type from URI
    const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      heic: "image/heic",
    };
    const mimeType = mimeTypes[extension] || "image/jpeg";

    return { base64, mimeType };
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
          "Failed to extract recipe from images. Please try again."
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
