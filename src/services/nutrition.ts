import AsyncStorage from '@react-native-async-storage/async-storage';

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

// OpenAI API call
const calculateNutritionWithOpenAI = async (
  ingredients: string[],
  servings: number
): Promise<NutritionInfo> => {
  const prompt = `Calculate the nutritional information per serving for a recipe with ${servings} servings using these ingredients:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

Please respond with ONLY a JSON object in this exact format:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "sugar": number,
  "fat": number
}

All values should be numbers representing grams except calories. Be as accurate as possible.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate nutrition with OpenAI');
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse nutrition response:', content);
    throw new Error('Invalid nutrition response format');
  }
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

  // Always use OpenAI now
  const nutritionData = await calculateNutritionWithOpenAI(ingredients, servings);

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
