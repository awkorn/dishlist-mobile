import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  sugar?: number;
  fat?: number;
}

// Cache key generator
const getCacheKey = (ingredients: string[], servings: number): string => {
  const ingredientsKey = ingredients.sort().join('|');
  return `nutrition_${btoa(ingredientsKey)}_${servings}`;
};

// Main calculation function with caching
export const calculateNutrition = async (
  ingredients: string[],
  servings: number
): Promise<NutritionInfo> => {
  const cacheKey = getCacheKey(ingredients, servings);

  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      console.log('Using cached nutrition data');
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Failed to read nutrition cache:', error);
  }

  // Call backend API
  const response = await api.post('/nutrition/calculate', {
    ingredients,
    servings,
  });

  const nutritionData = response.data.nutrition;

  // Cache the result
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(nutritionData));
  } catch (cacheError) {
    console.warn('Failed to cache nutrition data:', cacheError);
  }

  return nutritionData;
};

// Clear nutrition cache (useful for debugging)
export const clearNutritionCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const nutritionKeys = keys.filter(key => key.startsWith('nutrition_'));
    await AsyncStorage.multiRemove(nutritionKeys);
  } catch (error) {
    console.warn('Failed to clear nutrition cache:', error);
  }
};