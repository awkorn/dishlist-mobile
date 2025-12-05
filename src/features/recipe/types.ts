export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  sugar?: number;
  fat?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  instructions?: string[];
  ingredients?: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  nutrition?: NutritionInfo | null;
  tags?: string[];
  creatorId: string;
  creator: {
    uid: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecipeData {
  title: string;
  description?: string;
  instructions: string[];
  ingredients: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string | null;
  nutrition?: NutritionInfo;
  tags?: string[];
  dishListId: string;
}

export interface UpdateRecipeData {
  title: string;
  description?: string;
  instructions: string[];
  ingredients: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string | null;
  nutrition?: NutritionInfo;
  tags?: string[];
}

export interface RecipeProgress {
  checkedIngredients: Set<number>;
  completedSteps: Set<number>;
}

export interface SerializedRecipeProgress {
  checkedIngredients: number[];
  completedSteps: number[];
}

export interface ImportedRecipeData {
  title: string;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  ingredients: string[];
  instructions: string[];
}

export interface ImportRecipeResponse {
  recipe: ImportedRecipeData;
  warnings?: string[];
  success: boolean;
}

export interface ImageData {
  base64: string;
  mimeType: string;
  uri: string; // Local URI for preview
}