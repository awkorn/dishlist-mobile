// ============================================================================
// Search Tab Types
// ============================================================================

export type SearchTab = "all" | "users" | "recipes" | "dishlists";

// ============================================================================
// Search Result Types
// ============================================================================

export interface SearchUser {
  uid: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
  isMutual: boolean;
  score: number;
}

export interface SearchRecipe {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  tags: string[];
  creatorId: string;
  creator: {
    uid: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  score: number;
}

export interface SearchDishList {
  id: string;
  title: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  recipeCount: number;
  followerCount: number;
  owner: {
    uid: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  isFollowing: boolean;
  isCollaborator: boolean;
  score: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface SearchResponse {
  users: SearchUser[];
  recipes: SearchRecipe[];
  dishLists: SearchDishList[];
  nextCursor: string | null;
}

// ============================================================================
// Search State Types
// ============================================================================

export interface SearchState {
  query: string;
  tab: SearchTab;
  isSearching: boolean;
}