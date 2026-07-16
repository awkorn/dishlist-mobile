import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { Image } from "expo-image";
import { ImageIcon, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@styles/theme";
import { typography } from "@styles/typography";

interface RecipeGalleryProps {
  imageUrls: string[];
  recipeTitle: string;
}

export default function RecipeGallery({
  imageUrls,
  recipeTitle,
}: RecipeGalleryProps) {
  const { width } = useWindowDimensions();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<string>[] }) => {
      const nextIndex = viewableItems[0]?.index;
      if (nextIndex != null) setViewerIndex(nextIndex);
    },
  ).current;
  const closeViewer = useCallback(() => setViewerIndex(null), []);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gallery</Text>

      {imageUrls.length === 0 ? (
        <View style={styles.emptyState} accessibilityLabel="No recipe photos">
          <ImageIcon size={26} color={theme.colors.neutral[400]} />
          <Text style={styles.emptyText}>No photos yet</Text>
        </View>
      ) : (
        <FlatList
          horizontal
          data={imageUrls}
          keyExtractor={(url, index) => `${url}-${index}`}
          contentContainerStyle={styles.previewList}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => setViewerIndex(index)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Open ${recipeTitle} photo ${index + 1} of ${imageUrls.length}`}
            >
              <Image
                source={{ uri: item }}
                style={styles.previewImage}
                cachePolicy="memory-disk"
                contentFit="cover"
              />
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={viewerIndex !== null}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={closeViewer}
      >
        <SafeAreaView style={styles.viewer}>
          <View style={styles.viewerHeader}>
            <Text style={styles.viewerCount}>
              {(viewerIndex ?? 0) + 1} of {imageUrls.length}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeViewer}
              accessibilityRole="button"
              accessibilityLabel="Close gallery"
            >
              <X size={26} color={theme.colors.surface} />
            </TouchableOpacity>
          </View>
          {viewerIndex !== null && (
            <FlatList
              horizontal
              pagingEnabled
              data={imageUrls}
              initialScrollIndex={viewerIndex}
              keyExtractor={(url, index) => `viewer-${url}-${index}`}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              showsHorizontalScrollIndicator={false}
              viewabilityConfig={viewabilityConfig}
              onViewableItemsChanged={onViewableItemsChanged}
              renderItem={({ item, index }) => (
                <View style={[styles.viewerPage, { width }]}>
                  <Image
                    source={{ uri: item }}
                    style={styles.viewerImage}
                    cachePolicy="memory-disk"
                    contentFit="contain"
                    accessibilityLabel={`${recipeTitle} photo ${index + 1}`}
                  />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  sectionTitle: {
    ...typography.heading3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  previewList: {
    gap: theme.spacing.md,
  },
  previewImage: {
    width: 184,
    height: 132,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[200],
  },
  emptyState: {
    minHeight: 112,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: theme.colors.neutral[500],
  },
  viewer: {
    flex: 1,
    backgroundColor: theme.colors.neutral[900],
  },
  viewerHeader: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: theme.spacing.md,
  },
  viewerCount: {
    ...typography.utilityCaption,
    color: theme.colors.surface,
  },
  closeButton: {
    position: "absolute",
    right: theme.spacing.md,
    bottom: 0,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerPage: {
    flex: 1,
    justifyContent: "center",
  },
  viewerImage: {
    width: "100%",
    height: "100%",
  },
});
