import { extractIngredientCore } from "./ingredientParser";

interface RecipeItem {
  type: "item" | "header";
  text: string;
}

interface SearchableRecipe {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  ingredients?: string[] | RecipeItem[];
}

interface SearchableDishList {
  id: string;
  title: string;
  description?: string;
}

export interface SearchMatch {
  field: "title" | "description" | "tag" | "ingredient";
  term: string;
}

// Helper to extract text from ingredients (handles both formats)
function getIngredientTexts(
  ingredients: string[] | RecipeItem[] | undefined
): string[] {
  if (!ingredients || ingredients.length === 0) return [];

  // Check if it's the new format
  if (typeof ingredients[0] === "object" && "type" in ingredients[0]) {
    return (ingredients as RecipeItem[])
      .filter((item) => item.type === "item")
      .map((item) => item.text);
  }

  // Legacy format
  return ingredients as string[];
}

/**
 * Searches recipes by title, tags, and ingredients using intelligent matching.
 * Uses OR logic - matches if ANY search term matches ANY field.
 */
export function searchRecipes<T extends SearchableRecipe>(
  recipes: T[],
  query: string
): T[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return recipes;

  const searchTerms = trimmedQuery
    .split(/\s+/)
    .filter((term) => term.length > 0);

  return recipes.filter((recipe) => {
    return searchTerms.some((term) => {
      // Check title
      if (recipe.title.toLowerCase().includes(term)) {
        return true;
      }

      // Check description
      if (recipe.description?.toLowerCase().includes(term)) {
        return true;
      }

      // Check tags
      if (recipe.tags?.some((tag) => tag.toLowerCase().includes(term))) {
        return true;
      }

      // Check ingredients (handles both formats)
      const ingredientTexts = getIngredientTexts(recipe.ingredients);
      if (
        ingredientTexts.some((ingredient) => {
          if (ingredient.toLowerCase().includes(term)) {
            return true;
          }

          const coreWords = extractIngredientCore(ingredient);
          return coreWords.some(
            (word) => word.includes(term) || term.includes(word)
          );
        })
      ) {
        return true;
      }

      return false;
    });
  });
}

/**
 * Searches dishlists by title and description.
 *
 * @param dishLists - Array of dishlists to search
 * @param query - Search query string
 * @returns Filtered array of matching dishlists
 */
export function searchDishLists<T extends SearchableDishList>(
  dishLists: T[],
  query: string
): T[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return dishLists;

  const searchTerms = trimmedQuery
    .split(/\s+/)
    .filter((term) => term.length > 0);

  return dishLists.filter((dishList) => {
    return searchTerms.some((term) => {
      if (dishList.title.toLowerCase().includes(term)) {
        return true;
      }
      if (dishList.description?.toLowerCase().includes(term)) {
        return true;
      }
      return false;
    });
  });
}
