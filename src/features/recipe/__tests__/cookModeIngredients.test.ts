import {
  getCookModeIngredients,
  getCookModeIngredientsForStep,
} from "../utils/cookModeIngredients";
import type { RecipeItem } from "../types";

const basicIngredients: RecipeItem[] = [
  { type: "item", text: "2 cups flour" },
  { type: "item", text: "1 cup sugar" },
  { type: "item", text: "1/2 tsp salt" },
  { type: "item", text: "2 tbsp olive oil" },
];

describe("getCookModeIngredients", () => {
  it("returns directly named ingredients in recipe order", () => {
    expect(
      getCookModeIngredients(
        basicIngredients,
        "Whisk the salt into the flour."
      )
    ).toEqual(["2 cups flour", "1/2 tsp salt"]);
  });

  it.each([
    "Mix all ingredients.",
    "Combine all of the ingredients.",
    "Stir everything together.",
  ])("returns every ingredient for a broad reference: %s", (instruction) => {
    expect(getCookModeIngredients(basicIngredients, instruction)).toEqual(
      basicIngredients.map((ingredient) => ingredient.text)
    );
  });

  it.each([
    "Add the remaining ingredients.",
    "Mix in all other ingredients.",
  ])(
    "returns only ingredients that were not surfaced by earlier steps: %s",
    (instruction) => {
      expect(
        getCookModeIngredients(basicIngredients, instruction, {
          previouslyShownIngredients: ["2 cups flour", "1 cup sugar"],
        })
      ).toEqual(["1/2 tsp salt", "2 tbsp olive oil"]);
    }
  );

  it("uses named ingredient groups and never returns their headers", () => {
    const groupedIngredients: RecipeItem[] = [
      { type: "header", text: "Dry Ingredients" },
      { type: "item", text: "2 cups flour" },
      { type: "item", text: "1 tsp baking powder" },
      { type: "header", text: "Wet Ingredients" },
      { type: "item", text: "2 eggs" },
      { type: "item", text: "1 cup milk" },
    ];

    expect(
      getCookModeIngredients(
        groupedIngredients,
        "Whisk the dry ingredients together."
      )
    ).toEqual(["2 cups flour", "1 tsp baking powder"]);
  });

  it("scopes broad references to the matching instruction subsection", () => {
    const groupedIngredients: RecipeItem[] = [
      { type: "header", text: "For the cake" },
      { type: "item", text: "2 cups flour" },
      { type: "item", text: "1 cup sugar" },
      { type: "header", text: "For the sauce" },
      { type: "item", text: "1 cup berries" },
      { type: "item", text: "2 tbsp honey" },
    ];

    expect(
      getCookModeIngredients(groupedIngredients, "Mix all ingredients.", {
        instructionSection: "Making the sauce",
      })
    ).toEqual(["1 cup berries", "2 tbsp honey"]);
  });

  it("supports ingredient and group exclusions", () => {
    expect(
      getCookModeIngredients(
        basicIngredients,
        "Mix all ingredients except the salt."
      )
    ).toEqual(["2 cups flour", "1 cup sugar", "2 tbsp olive oil"]);

    const groupedIngredients: RecipeItem[] = [
      { type: "header", text: "Base ingredients" },
      { type: "item", text: "2 cups flour" },
      { type: "header", text: "Topping ingredients" },
      { type: "item", text: "1 cup sugar" },
    ];

    expect(
      getCookModeIngredients(
        groupedIngredients,
        "Mix all ingredients except the topping ingredients."
      )
    ).toEqual(["2 cups flour"]);
  });

  it("does not mistake a cooking modifier for an ingredient exclusion", () => {
    expect(
      getCookModeIngredients(
        basicIngredients,
        "Cook without stirring, then add the salt."
      )
    ).toEqual(["1/2 tsp salt"]);
  });

  it("ignores blank ingredient items and preserves duplicate lines", () => {
    const ingredients: RecipeItem[] = [
      { type: "item", text: "" },
      { type: "item", text: "1 tsp salt" },
      { type: "item", text: "1 tsp salt" },
    ];

    expect(getCookModeIngredients(ingredients, "Mix all ingredients.")).toEqual([
      "1 tsp salt",
      "1 tsp salt",
    ]);
  });

  it("does not match an ingredient inside another instruction word", () => {
    expect(
      getCookModeIngredients(basicIngredients, "Boil the water for 5 minutes.")
    ).toEqual([]);
  });

  it("carries surfaced ingredients forward for a later remaining step", () => {
    expect(
      getCookModeIngredientsForStep(
        basicIngredients,
        [
          { instruction: "Whisk the flour and sugar.", subsection: null },
          { instruction: "Add all remaining ingredients.", subsection: null },
        ],
        1
      )
    ).toEqual(["1/2 tsp salt", "2 tbsp olive oil"]);
  });
});
