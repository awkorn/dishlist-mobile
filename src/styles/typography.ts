const fontFamilies = {
  ui: "Geist-Regular",
  uiMedium: "Geist-Medium",
  uiSemiBold: "Geist-SemiBold",
  uiBold: "Geist-Bold",
  reading: "Inter-Regular",
  readingMedium: "Inter-Medium",
  readingSemiBold: "Inter-SemiBold",
  editorial: "PlayfairDisplay-Regular",
  editorialMedium: "PlayfairDisplay-Medium",
  editorialSemiBold: "PlayfairDisplay-SemiBold",
} as const;

/**
 * DishList typography roles
 *
 * - Playfair introduces featured culinary content.
 * - Geist organizes the product and communicates actions.
 * - Inter supports sustained recipe reading and dense factual metadata.
 *
 * Keep a component or visual region to two typefaces whenever possible.
 */
export const typography = {
  families: fontFamilies,

  // Backwards-compatible family aliases. Prefer `families` in new styles.
  primary: fontFamilies.ui,
  primaryMedium: fontFamilies.uiMedium,
  primarySemiBold: fontFamilies.uiSemiBold,
  primaryBold: fontFamilies.uiBold,

  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },

  // Product hierarchy: Geist is the default interface voice.
  heading1: {
    fontFamily: fontFamilies.uiMedium,
    fontSize: 48,
    lineHeight: 56,
  },
  heading2: {
    fontFamily: fontFamilies.uiMedium,
    fontSize: 36,
    lineHeight: 40,
  },
  heading3: {
    fontFamily: fontFamilies.uiMedium,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heading4: {
    fontFamily: fontFamilies.uiMedium,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  pageTitle: {
    fontFamily: fontFamilies.uiMedium,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  navigationTitle: {
    fontFamily: fontFamilies.uiMedium,
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: fontFamilies.uiMedium,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.25,
  },
  recipeCardTitle: {
    fontFamily: fontFamilies.uiMedium,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamilies.ui,
    fontSize: 16,
    lineHeight: 22,
  },
  button: {
    fontFamily: fontFamilies.uiMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  caption: {
    fontFamily: fontFamilies.ui,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: fontFamilies.uiMedium,
    fontSize: 14,
    lineHeight: 20,
  },

  // Editorial hierarchy: intentionally rare.
  editorialPageTitle: {
    fontFamily: fontFamilies.editorialSemiBold,
    fontSize: 36,
    lineHeight: 40,
  },
  recipeDetailTitle: {
    fontFamily: fontFamilies.editorialSemiBold,
    fontSize: 36,
    lineHeight: 40,
  },
  recipeSheetTitle: {
    fontFamily: fontFamilies.editorialMedium,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.2,
  },

  // Reading and data hierarchy: Inter is used only where density earns it.
  recipeReading: {
    fontFamily: fontFamilies.reading,
    fontSize: 16,
    lineHeight: 24,
  },
  recipeReadingCompact: {
    fontFamily: fontFamilies.reading,
    fontSize: 15,
    lineHeight: 22,
  },
  utilityCaption: {
    fontFamily: fontFamilies.reading,
    fontSize: 14,
    lineHeight: 20,
  },
  utilityCaptionEmphasis: {
    fontFamily: fontFamilies.readingMedium,
    fontSize: 14,
    lineHeight: 20,
  },

};
