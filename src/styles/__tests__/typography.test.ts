import { typography } from "../typography";

describe("typography roles", () => {
  it("uses Geist as the product voice", () => {
    expect(typography.families.uiMedium).toBe("Geist-Medium");
    expect(typography.primaryMedium).toBe(typography.families.uiMedium);
    expect(typography.pageTitle.fontFamily).toBe(typography.families.uiMedium);
    expect(typography.navigationTitle.fontFamily).toBe(
      typography.families.uiMedium,
    );
    expect(typography.body.fontFamily).toBe(typography.families.ui);
    expect(typography.caption.fontFamily).toBe(typography.families.ui);
    expect(typography.button.fontFamily).toBe(typography.families.uiMedium);
    expect(typography.recipeCardTitle.fontFamily).toBe(
      typography.families.uiMedium,
    );
  });

  it("reserves Playfair for editorial and recipe titles", () => {
    expect(typography.editorialPageTitle.fontFamily).toBe(
      typography.families.editorialSemiBold,
    );
    expect(typography.recipeDetailTitle.fontFamily).toBe(
      typography.families.editorialSemiBold,
    );
    expect(typography.recipeSheetTitle.fontFamily).toBe(
      typography.families.editorialMedium,
    );
  });

  it("uses Inter only for reading and utility roles", () => {
    expect(typography.recipeReading.fontFamily).toBe(
      typography.families.reading,
    );
    expect(typography.utilityCaption.fontFamily).toBe(
      typography.families.reading,
    );
    expect(typography.utilityCaptionEmphasis.fontFamily).toBe(
      typography.families.readingMedium,
    );
  });
});
