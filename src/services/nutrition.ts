import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  sugar?: number;
  fat?: number;
}

// Small, Unicode-safe string hash (djb2). Avoids btoa, which throws on any
// non-Latin1 character (e.g. "½", "jalapeño") that routinely appears in recipe
// ingredients.
const hashString = (value: string): string => {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  // >>> 0 coerces to an unsigned 32-bit int for a stable, positive key.
  return (hash >>> 0).toString(36);
};

// Cache key generator. Copies before sorting so the caller's array is not
// mutated, and hashes the joined ingredients for a collision-resistant key.
const getCacheKey = (ingredients: string[], servings: number): string => {
  const ingredientsKey = [...ingredients].sort().join('|');
  return `nutrition_${hashString(ingredientsKey)}_${servings}`;
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