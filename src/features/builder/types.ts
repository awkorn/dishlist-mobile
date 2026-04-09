import type { RecipeItem } from "@features/recipe/types";

// ─── Chat Messages ──────────────────────────────────────────────────
export interface BuilderMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recipes?: GeneratedRecipe[];
  timestamp: number;
}

// ─── Generated Recipe (ephemeral, not saved to DB) ──────────────────
export interface GeneratedRecipe {
  title: string;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  ingredients: RecipeItem[];
  instructions: RecipeItem[];
  tags: string[];
}

// ─── API Request / Response ─────────────────────────────────────────
export interface GenerateRecipesRequest {
  prompt: string;
  history?: { role: "user" | "assistant"; content: string }[];
  preferences?: string[];
}

export interface GenerateRecipesResponse {
  recipes: GeneratedRecipe[];
  assistantContent: string;
}

// ─── Preferences (static for now, will be user-configurable) ────────
export const DEFAULT_PREFERENCES: string[] = [];

export const AVAILABLE_PREFERENCES = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "High Protein",
  "Low Carb",
  "Nut-Free",
  "Paleo",
  "Quick (under 30 min)",
] as const;

export type PreferenceOption = (typeof AVAILABLE_PREFERENCES)[number];
