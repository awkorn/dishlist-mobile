import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { clearAppGroupContainer } from "expo-share-extension";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app-types/navigation";
import Button from "@components/ui/Button";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";
import { dishlistService } from "@features/dishlist/services";
import {
  clearPendingSharedImages,
  readPendingSharedImages,
} from "@features/shareExtension/sharedStorage";
import { recipeService } from "../services";
import type { ImageData } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "SharedImageImport">;

export default function SharedImageImportScreen({ navigation }: Props) {
  const [state, setState] = useState<"working" | "error" | "missing">("working");
  const [message, setMessage] = useState("Preparing shared screenshots…");

  const run = useCallback(async () => {
    const payload = readPendingSharedImages();
    if (!payload?.paths.length) {
      setState("missing");
      return;
    }
    setState("working");
    try {
      setMessage("Preparing shared screenshots…");
      const images: ImageData[] = await Promise.all(
        payload.paths.map(async (path) => {
          const uri = path.startsWith("file://") ? path : `file://${path}`;
          const normalized = await manipulateAsync(
            uri,
            [{ resize: { width: 1568 } }],
            { base64: true, compress: 0.7, format: SaveFormat.JPEG }
          );
          if (!normalized.base64) throw new Error("Could not prepare shared image");
          return { uri, base64: normalized.base64, mimeType: "image/jpeg" };
        })
      );
      setMessage("Reading the recipe…");
      const [result, lists] = await Promise.all([
        recipeService.importFromImages(images),
        dishlistService.getDishLists("my"),
      ]);
      const destination =
        lists.dishLists.find((list) => list.isDefault) ?? lists.dishLists[0];
      if (!destination) throw new Error("No DishList is available for this recipe");
      clearPendingSharedImages();
      await clearAppGroupContainer({ cleanUpBefore: new Date() }).catch(() => {});
      navigation.replace("AddRecipe", {
        dishListId: destination.id,
        importedRecipe: result.recipe,
        importWarnings: result.warnings,
      });
    } catch (error) {
      console.error("Shared screenshot import failed:", error);
      setMessage(error instanceof Error ? error.message : "Couldn’t read these screenshots.");
      setState("error");
    }
  }, [navigation]);

  useEffect(() => {
    void run();
  }, [run]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content} accessibilityLiveRegion="polite">
        {state === "working" && <ActivityIndicator size="large" color={theme.colors.primary[500]} />}
        <Text style={styles.title}>
          {state === "missing" ? "No shared screenshots found" : state === "error" ? "Couldn’t import screenshots" : "Importing screenshots"}
        </Text>
        <Text style={styles.message}>{state === "missing" ? "Share the screenshots to DishList again." : message}</Text>
        {state === "error" && <Button title="Try Again" onPress={() => void run()} style={styles.button} />}
        {state !== "working" && <Button title="Close" variant="secondary" onPress={navigation.goBack} style={styles.button} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  title: { ...typography.editorialPageTitle, color: theme.colors.textPrimary, textAlign: "center", marginTop: 20 },
  message: { ...typography.body, color: theme.colors.neutral[600], textAlign: "center", marginTop: 10 },
  button: { marginTop: 16, minWidth: 180 },
});
