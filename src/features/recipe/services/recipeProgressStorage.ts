import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RecipeProgress, SerializedRecipeProgress } from '../types';

const PROGRESS_KEY_PREFIX = 'recipe_progress_';

export const recipeProgressStorage = {
  /**
   * Load recipe progress from AsyncStorage
   */
  async loadProgress(recipeId: string): Promise<RecipeProgress> {
    try {
      const key = `${PROGRESS_KEY_PREFIX}${recipeId}`;
      const saved = await AsyncStorage.getItem(key);
      
      if (saved) {
        const parsed: SerializedRecipeProgress = JSON.parse(saved);
        return {
          checkedIngredients: new Set(parsed.checkedIngredients || []),
          completedSteps: new Set(parsed.completedSteps || []),
        };
      }
      
      return {
        checkedIngredients: new Set(),
        completedSteps: new Set(),
      };
    } catch (error) {
      console.warn('Failed to load recipe progress:', error);
      return {
        checkedIngredients: new Set(),
        completedSteps: new Set(),
      };
    }
  },

  /**
   * Save recipe progress to AsyncStorage
   */
  async saveProgress(recipeId: string, progress: RecipeProgress): Promise<void> {
    try {
      const key = `${PROGRESS_KEY_PREFIX}${recipeId}`;
      const serialized: SerializedRecipeProgress = {
        checkedIngredients: Array.from(progress.checkedIngredients),
        completedSteps: Array.from(progress.completedSteps),
      };
      await AsyncStorage.setItem(key, JSON.stringify(serialized));
    } catch (error) {
      console.warn('Failed to save recipe progress:', error);
    }
  },

  /**
   * Clear recipe progress from AsyncStorage
   */
  async clearProgress(recipeId: string): Promise<void> {
    try {
      const key = `${PROGRESS_KEY_PREFIX}${recipeId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear recipe progress:', error);
    }
  },
};