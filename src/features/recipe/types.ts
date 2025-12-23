export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  sugar?: number;
  fat?: number;
}

export type RecipeItemType = "item" | "header";

export interface RecipeItem {
  type: RecipeItemType;
  text: string;
}

// Helper type guards
export function isHeader(item: RecipeItem): boolean {
  return item.type === "header";
}

export function isItem(item: RecipeItem): boolean {
  return item.type === "item";
}

// Utility to convert legacy string[] to RecipeItem[] (for backward compatibility)
export function convertLegacyToStructured(
  items: string[] | RecipeItem[]
): RecipeItem[] {
  if (!items || items.length === 0) {
    return [{ type: "item", text: "" }];
  }

  // Check if already in new format
  if (typeof items[0] === "object" && "type" in items[0]) {
    return items as RecipeItem[];
  }

  // Convert from legacy string array
  return (items as string[]).map((text) => ({ type: "item" as const, text }));
}

// Utility to extract only items (no headers) - useful for grocery list
export function extractItemTexts(items: RecipeItem[]): string[] {
  return items
    .filter(isItem)
    .map((item) => item.text)
    .filter((text) => text.trim());
}

// Get the current subsection for an item index (for CookMode)
export function getSubsectionForIndex(
  items: RecipeItem[],
  index: number
): string | null {
  // Find the nearest header above this index
  for (let i = index - 1; i >= 0; i--) {
    if (items[i].type === "header") {
      return items[i].text;
    }
  }
  return null;
}

// Validation: ensure at least one actual item exists
export function hasAtLeastOneItem(items: RecipeItem[]): boolean {
  return items.some((item) => item.type === "item" && item.text.trim());
}

// Clean empty items on save
export function cleanEmptyItems(items: RecipeItem[]): RecipeItem[] {
  const cleaned: RecipeItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.type === "item") {
      if (item.text.trim()) {
        cleaned.push({ type: "item", text: item.text.trim() });
      }
    } else if (item.type === "header") {
      // Check if header has items below it
      let hasItemsBelow = false;
      for (let j = i + 1; j < items.length; j++) {
        if (items[j].type === "header") break;
        if (items[j].type === "item" && items[j].text.trim()) {
          hasItemsBelow = true;
          break;
        }
      }
      if (hasItemsBelow && item.text.trim()) {
        cleaned.push({ type: "header", text: item.text.trim() });
      }
    }
  }

  return cleaned;
}

// Get actual step number for an instruction (excluding headers)
export function getStepNumber(items: RecipeItem[], index: number): number {
  let stepCount = 0;
  for (let i = 0; i <= index; i++) {
    if (items[i].type === "item") {
      stepCount++;
    }
  }
  return stepCount;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  instructions?: RecipeItem[];
  ingredients?: RecipeItem[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  nutrition?: NutritionInfo | null;
  tags?: string[];
  isShareable?: boolean;
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
  instructions: RecipeItem[];
  ingredients: RecipeItem[];
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
  instructions: RecipeItem[];
  ingredients: RecipeItem[];
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
  ingredients: RecipeItem[];
  instructions: RecipeItem[];
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