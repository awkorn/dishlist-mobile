const fontFamilies = {
  ui: "Bricolage-Regular",
  uiSemiBold: "Bricolage-SemiBold",
  uiBold: "Bricolage-Bold",
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
 * - Bricolage organizes the product and communicates actions.
 * - Inter supports sustained recipe reading and dense factual metadata.
 *
 * Keep a component or visual region to two typefaces whenever possible.
 */
export const typography = {
  families: fontFamilies,

  // Backwards-compatible family aliases. Prefer `families` in new styles.
  primary: fontFamilies.ui,
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

  // Product hierarchy: Bricolage is the default interface voice.
  heading1: {
    fontFamily: fontFamilies.uiSemiBold,
    fontSize: 48,
    lineHeight: 56,
  },
  heading2: {
    fontFamily: fontFamilies.uiSemiBold,
    fontSize: 36,
    lineHeight: 40,
  },
  heading3: {
    fontFamily: fontFamilies.uiSemiBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heading4: {
    fontFamily: fontFamilies.uiSemiBold,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  pageTitle: {
    fontFamily: fontFamilies.uiSemiBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  navigationTitle: {
    fontFamily: fontFamilies.uiSemiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: fontFamilies.uiSemiBold,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.25,
  },
  recipeCardTitle: {
    fontFamily: fontFamilies.uiSemiBold,
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
    fontFamily: fontFamilies.uiSemiBold,
    fontSize: 16,
    lineHeight: 21,
  },
  caption: {
    fontFamily: fontFamilies.ui,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: fontFamilies.uiSemiBold,
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
