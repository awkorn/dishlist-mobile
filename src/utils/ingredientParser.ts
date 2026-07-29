export const extractIngredientCore = (ingredient: string): string[] => {
  const text = ingredient.toLowerCase();

  // Remove common measurements
  const measurements =
    /\b(\d+\/?\d*\s*)?(cup|cups|tbsp|tsp|teaspoon|tablespoon|oz|ounce|lb|pound|g|gram|kg|ml|liter|pinch|dash|handful)\b/gi;
  let cleaned = text.replace(measurements, "");

  // Remove common prep methods
  const prepMethods =
    /\b(chopped|diced|sliced|minced|grated|shredded|crushed|whole|fresh|dried|frozen|canned|cooked|raw|to taste)\b/gi;
  cleaned = cleaned.replace(prepMethods, "");

  // Remove numbers and special characters
  cleaned = cleaned.replace(/\d+/g, "").replace(/[,()]/g, "");

  // Split into words and filter out short/common words
  const stopWords = [
    "a",
    "an",
    "the",
    "of",
    "for",
    "in",
    "on",
    "to",
    "and",
    "or",
  ];
  const words = cleaned
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word))
    .map((word) => word.trim())
    .filter((word) => word.length > 0);

  return words;
};

/**
 * Checks if an ingredient is mentioned in an instruction
 * Uses fuzzy matching to handle variations
 */
export const isIngredientInInstruction = (
  ingredient: string,
  instruction: string
): boolean => {
  const ingredientWords = extractIngredientCore(ingredient);
  const instructionWords = instruction
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // Common cooking verbs that shouldn't trigger matches
  const cookingVerbs = [
    "heat",
    "cook",
    "add",
    "mix",
    "stir",
    "pour",
    "season",
    "serve",
    "place",
    "remove",
    "cut",
    "chop",
    "dice",
    "slice",
    "combine",
    "blend",
    "whisk",
    "fold",
    "bring",
    "reduce",
    "simmer",
  ];

  const singularize = (word: string): string => {
    if (word.length > 4 && word.endsWith("ies")) {
      return `${word.slice(0, -3)}y`;
    }
    if (word.length > 4 && word.endsWith("oes")) {
      return word.slice(0, -2);
    }
    if (word.length > 4 && /(ches|shes|xes|zes)$/.test(word)) {
      return word.slice(0, -2);
    }
    if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
      return word.slice(0, -1);
    }
    return word;
  };

  const normalizedInstructionWords = new Set(
    instructionWords.flatMap((word) => [word, singularize(word)])
  );

  // Check if any core ingredient words appear as complete words in instruction.
  return ingredientWords.some((word) => {
    // Skip if it's just a cooking verb
    if (cookingVerbs.includes(word)) return false;

    const normalizedWord = word.replace(/[^a-z0-9]+/g, "");
    return (
      normalizedWord.length > 0 &&
      (normalizedInstructionWords.has(normalizedWord) ||
        normalizedInstructionWords.has(singularize(normalizedWord)))
    );
  });
};

/**
 * Highlights ingredient words in instruction text
 * Returns array of text segments with isHighlight flag
 */
export const highlightIngredientsInText = (
  instruction: string,
  ingredients: string[]
): Array<{ text: string; isHighlight: boolean }> => {
  const ingredientWords = ingredients.flatMap((ing) =>
    extractIngredientCore(ing)
  );

  if (ingredientWords.length === 0) {
    return [{ text: instruction, isHighlight: false }];
  }

  // Create regex pattern for all ingredient words
  const pattern = new RegExp(`\\b(${ingredientWords.join("|")})s?\\b`, "gi");

  const segments: Array<{ text: string; isHighlight: boolean }> = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(instruction)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      segments.push({
        text: instruction.slice(lastIndex, match.index),
        isHighlight: false,
      });
    }

    // Add highlighted match
    segments.push({
      text: match[0],
      isHighlight: true,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < instruction.length) {
    segments.push({
      text: instruction.slice(lastIndex),
      isHighlight: false,
    });
  }

  return segments.length > 0
    ? segments
    : [{ text: instruction, isHighlight: false }];
};
