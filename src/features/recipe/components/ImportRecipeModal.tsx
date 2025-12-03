import React, { useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Camera, ImageIcon, Plus, Trash2 } from 'lucide-react-native';
import { theme } from '@styles/theme';
import { typography } from '@styles/typography';
import Button from '@components/ui/Button';
import { useImportRecipe } from '../hooks/useImportRecipe';
import type { ImportRecipeResponse } from '../types';

interface ImportRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onImportComplete: (data: ImportRecipeResponse) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - theme.spacing.xl * 2 - theme.spacing.md * 2) / 3;

export default function ImportRecipeModal({
  visible,
  onClose,
  onImportComplete,
}: ImportRecipeModalProps) {
  const {
    selectedImages,
    isProcessing,
    processingStatus,
    pickFromLibrary,
    takePhoto,
    removeImage,
    clearImages,
    processImages,
  } = useImportRecipe({
    onSuccess: (response) => {
      onImportComplete(response);
      clearImages();
      onClose();
    },
  });

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      clearImages();
      onClose();
    }
  }, [isProcessing, clearImages, onClose]);

  const handleProcess = useCallback(async () => {
    await processImages();
  }, [processImages]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            disabled={isProcessing}
            style={styles.closeButton}
          >
            <X size={24} color={theme.colors.neutral[700]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Import Recipe</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={theme.colors.primary[500]} />
              <Text style={styles.processingTitle}>Extracting Recipe</Text>
              <Text style={styles.processingStatus}>{processingStatus}</Text>
              <Text style={styles.processingHint}>
                This may take a few seconds...
              </Text>
            </View>
          </View>
        )}

        {/* Content */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>
              📸 Add photos of your recipe
            </Text>
            <Text style={styles.instructionsText}>
              Take photos or select images of a recipe (cookbook, screenshot, handwritten).
              Our AI will extract the title, ingredients, instructions, and more.
            </Text>
            <Text style={styles.instructionsNote}>
              Tip: For multi-page recipes, add up to 5 photos and we'll combine them.
            </Text>
          </View>

          {/* Image Selection Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.sourceButton}
              onPress={takePhoto}
              disabled={isProcessing || selectedImages.length >= 5}
            >
              <Camera size={28} color={theme.colors.primary[500]} />
              <Text style={styles.sourceButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sourceButton}
              onPress={pickFromLibrary}
              disabled={isProcessing || selectedImages.length >= 5}
            >
              <ImageIcon size={28} color={theme.colors.primary[500]} />
              <Text style={styles.sourceButtonText}>Choose Photos</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Images Grid */}
          {selectedImages.length > 0 && (
            <View style={styles.imagesSection}>
              <View style={styles.imagesSectionHeader}>
                <Text style={styles.imagesSectionTitle}>
                  Selected Photos ({selectedImages.length}/5)
                </Text>
                <TouchableOpacity onPress={clearImages} disabled={isProcessing}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.imagesGrid}>
                {selectedImages.map((image, index) => (
                  <View key={image.uri} style={styles.imageContainer}>
                    <Image source={{ uri: image.uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                      disabled={isProcessing}
                    >
                      <X size={14} color={theme.colors.surface} />
                    </TouchableOpacity>
                    <View style={styles.imageIndex}>
                      <Text style={styles.imageIndexText}>{index + 1}</Text>
                    </View>
                  </View>
                ))}

                {/* Add More Button */}
                {selectedImages.length < 5 && (
                  <TouchableOpacity
                    style={styles.addMoreButton}
                    onPress={pickFromLibrary}
                    disabled={isProcessing}
                  >
                    <Plus size={24} color={theme.colors.neutral[400]} />
                    <Text style={styles.addMoreText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Extract Recipe"
            onPress={handleProcess}
            disabled={selectedImages.length === 0 || isProcessing}
            loading={isProcessing}
            style={styles.extractButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    ...typography.heading3,
    color: theme.colors.neutral[800],
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.xl,
  },
  instructionsCard: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  instructionsTitle: {
    ...typography.subtitle,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  instructionsText: {
    ...typography.body,
    color: theme.colors.primary[600],
    marginBottom: theme.spacing.sm,
  },
  instructionsNote: {
    ...typography.caption,
    color: theme.colors.primary[500],
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  sourceButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.lg,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.surface,
  },
  sourceButtonText: {
    ...typography.button,
    color: theme.colors.primary[500],
    marginTop: theme.spacing.sm,
  },
  imagesSection: {
    marginBottom: theme.spacing.xl,
  },
  imagesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  imagesSectionTitle: {
    ...typography.subtitle,
    color: theme.colors.neutral[700],
  },
  clearAllText: {
    ...typography.caption,
    color: theme.colors.error,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndex: {
    position: 'absolute',
    bottom: theme.spacing.xs,
    left: theme.spacing.xs,
    backgroundColor: theme.colors.primary[500],
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndexText: {
    ...typography.caption,
    color: theme.colors.surface,
    fontWeight: '600',
    fontSize: 11,
  },
  addMoreButton: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.neutral[300],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.neutral[50],
  },
  addMoreText: {
    ...typography.caption,
    color: theme.colors.neutral[400],
    marginTop: theme.spacing.xs,
  },
  footer: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
  extractButton: {
    width: '100%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  processingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing["4xl"],
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  processingTitle: {
    ...typography.subtitle,
    color: theme.colors.neutral[800],
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  processingStatus: {
    ...typography.body,
    color: theme.colors.primary[500],
    marginBottom: theme.spacing.sm,
  },
  processingHint: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    textAlign: 'center',
  },
});