import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Clock, Users } from 'lucide-react-native';
import { Recipe } from '../../services/api';
import { typography } from '../../styles/typography';
import { theme } from '../../styles/theme';
import { ComponentErrorBoundary } from '../../providers/ErrorBoundary';

interface RecipeTileProps {
  recipe: Recipe;
  onPress?: () => void;
}

const { width } = Dimensions.get('window');
const tileWidth = (width - theme.spacing.xl * 2 - theme.spacing.lg) / 2;

export default function RecipeTile({ recipe, onPress }: RecipeTileProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <ComponentErrorBoundary
      componentName="RecipeTile"
      fallback={
        <View style={[styles.container, styles.errorContainer]}>
          <Text style={styles.errorText}>Unable to load recipe</Text>
        </View>
      }
    >
      <TouchableOpacity style={styles.container} onPress={onPress}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🍽️</Text>
          </View>
        )}
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Text>
          
          {recipe.description && (
            <Text style={styles.description} numberOfLines={2}>
              {recipe.description}
            </Text>
          )}
          
          <View style={styles.metadata}>
            {totalTime > 0 && (
              <View style={styles.metadataItem}>
                <Clock size={12} color={theme.colors.neutral[500]} />
                <Text style={styles.metadataText}>{totalTime}m</Text>
              </View>
            )}
            
            {recipe.servings && (
              <View style={styles.metadataItem}>
                <Users size={12} color={theme.colors.neutral[500]} />
                <Text style={styles.metadataText}>{recipe.servings}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.creator} numberOfLines={1}>
            by {recipe.creator.firstName || recipe.creator.username || 'Unknown'}
          </Text>
        </View>
      </TouchableOpacity>
    </ComponentErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    width: tileWidth,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
    overflow: 'hidden',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    ...typography.caption,
    color: theme.colors.neutral[500],
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.neutral[100],
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  content: {
    padding: theme.spacing.md,
  },
  title: {
    ...typography.subtitle,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  description: {
    ...typography.caption,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.sm,
    lineHeight: 16,
  },
  metadata: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metadataText: {
    ...typography.caption,
    color: theme.colors.neutral[500],
    fontSize: 12,
  },
  creator: {
    ...typography.caption,
    color: theme.colors.neutral[400],
    fontSize: 11,
  },
});