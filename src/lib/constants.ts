// ============================================================================
// Storage Keys
// ============================================================================
export const STORAGE_KEYS = {
  GROCERY_LIST: 'grocery_list',
  RECIPE_PROGRESS: 'recipe_progress_',
  NUTRITION_CACHE: 'nutrition_',
} as const;

// ============================================================================
// Query Stale Times
// ============================================================================
export const STALE_TIMES = {
  DISHLIST: 5 * 60 * 1000,      // 5 minutes
  DISHLIST_MY: 3 * 60 * 1000,   // 3 minutes (own lists change more)
  RECIPE: 5 * 60 * 1000,        // 5 minutes
  PROFILE: 5 * 60 * 1000,       // 5 minutes
  GROCERY: 1 * 60 * 1000        // 1 minute     
} as const;

// ============================================================================
// API Timeouts
// ============================================================================
export const API_TIMEOUT = 10000; // 10 seconds

// ============================================================================
// Validation
// ============================================================================
export const VALIDATION = {
  TITLE_MIN_LENGTH: 2,
  TITLE_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 200,
  BIO_MAX_LENGTH: 160,
  USERNAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 6,
} as const;

// ============================================================================
// UI Constants
// ============================================================================
export const UI = {
  SKELETON_COUNT: 6,
  NETWORK_INDICATOR_DURATION: 3000,
} as const;