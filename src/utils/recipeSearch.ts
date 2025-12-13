import { extractIngredientCore } from './ingredientParser';

interface SearchableRecipe {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  ingredients?: string[];
}

interface SearchableDishList {
  id: string;
  title: string;
  description?: string;
}

export interface SearchMatch {
  field: 'title' | 'description' | 'tag' | 'ingredient';
  term: string;
}

/**
 * Searches recipes by title, tags, and ingredients using intelligent matching.
 * Uses OR logic - matches if ANY search term matches ANY field.
 * 
 * @param recipes - Array of recipes to search
 * @param query - Search query string
 * @returns Filtered array of matching recipes
 */
export function searchRecipes<T extends SearchableRecipe>(
  recipes: T[],
  query: string
): T[] {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return recipes;

  // Split query into individual search terms
  const searchTerms = trimmedQuery.split(/\s+/).filter(term => term.length > 0);
  
  return recipes.filter(recipe => {
    return searchTerms.some(term => {
      // Check title
      if (recipe.title.toLowerCase().includes(term)) {
        return true;
      }

      // Check description
      if (recipe.description?.toLowerCase().includes(term)) {
        return true;
      }

      // Check tags (exact or partial match)
      if (recipe.tags?.some(tag => tag.toLowerCase().includes(term))) {
        return true;
      }

      // Check ingredients using intelligent parsing
      if (recipe.ingredients?.some(ingredient => {
        // First try direct match on the full ingredient string
        if (ingredient.toLowerCase().includes(term)) {
          return true;
        }
        
        // Then try matching against extracted core ingredient words
        const coreWords = extractIngredientCore(ingredient);
        return coreWords.some(word => 
          word.includes(term) || term.includes(word)
        );
      })) {
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

  const searchTerms = trimmedQuery.split(/\s+/).filter(term => term.length > 0);
  
  return dishLists.filter(dishList => {
    return searchTerms.some(term => {
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