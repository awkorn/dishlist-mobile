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
}

export interface RecipeProgress {
  checkedIngredients: Set<number>;
  completedSteps: Set<number>;
}

export interface SerializedRecipeProgress {
  checkedIngredients: number[];
  completedSteps: number[];
}