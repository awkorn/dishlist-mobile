import { isIngredientInInstruction } from "@utils/ingredientParser";
import type { RecipeItem } from "../types";

interface IngredientCandidate {
  text: string;
  section: string | null;
}

export interface CookModeIngredientContext {
  instructionSection?: string | null;
  previouslyShownIngredients?: string[];
}

export interface CookModeStep {
  instruction: string;
  subsection: string | null;
}

const ALL_INGREDIENTS_PATTERN =
  /\b(?:all(?:\s+of)?(?:\s+the)?|every)\s+(?:(?:remaining|other)\s+)?ingredients?\b|\beverything\b/i;
const REMAINING_INGREDIENTS_PATTERN =
  /\b(?:remaining|other)(?:\s+[a-z]+){0,3}\s+ingredients?\b|\brest of (?:the )?ingredients?\b/i;
const GENERAL_INGREDIENT_REFERENCE_PATTERN =
  /\b(?:the|these|those|prepared)\s+ingredients?\b/i;
const EXCLUSION_CLAUSE_PATTERN =
  /\b(?:except|excluding|without|but not)\b\s+(.+?)(?=\bthen\b|[,;.]|$)/i;

const SECTION_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "ingredient",
  "ingredients",
  "make",
  "making",
  "of",
  "prepare",
  "preparing",
  "the",
  "to",
]);

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getSectionWords = (section: string): string[] =>
  normalizeText(section)
    .split(/\s+/)
    .filter((word) => word && !SECTION_STOP_WORDS.has(word));

const buildCandidates = (ingredients: RecipeItem[]): IngredientCandidate[] => {
  let currentSection: string | null = null;

  return ingredients.flatMap((item) => {
    if (item.type === "header") {
      currentSection = item.text.trim() || null;
      return [];
    }

    const text = item.text.trim();
    return text ? [{ text, section: currentSection }] : [];
  });
};

const sectionsOverlap = (first: string, second: string): boolean => {
  const firstWords = getSectionWords(first);
  const secondWords = new Set(getSectionWords(second));
  return firstWords.some((word) => secondWords.has(word));
};

const getExplicitlyReferencedSections = (
  candidates: IngredientCandidate[],
  instruction: string
): Set<string> => {
  if (!/\bingredients?\b/i.test(instruction)) {
    return new Set();
  }

  const instructionWords = new Set(normalizeText(instruction).split(/\s+/));
  const sections = new Set(
    candidates
      .map((candidate) => candidate.section)
      .filter((section): section is string => Boolean(section))
  );

  return new Set(
    [...sections].filter((section) =>
      getSectionWords(section).some((word) => instructionWords.has(word))
    )
  );
};

const getSubsectionScope = (
  candidates: IngredientCandidate[],
  instructionSection: string | null | undefined
): Set<string> => {
  if (!instructionSection) {
    return new Set();
  }

  const sections = new Set(
    candidates
      .map((candidate) => candidate.section)
      .filter((section): section is string => Boolean(section))
  );

  return new Set(
    [...sections].filter((section) =>
      sectionsOverlap(section, instructionSection)
    )
  );
};

const candidatesInSections = (
  candidates: IngredientCandidate[],
  sections: Set<string>
): IngredientCandidate[] =>
  sections.size === 0
    ? []
    : candidates.filter(
        (candidate) =>
          candidate.section !== null && sections.has(candidate.section)
      );

const removePreviouslyShown = (
  candidates: IngredientCandidate[],
  previouslyShownIngredients: string[]
): IngredientCandidate[] => {
  const shownCounts = new Map<string, number>();

  previouslyShownIngredients.forEach((ingredient) => {
    const key = normalizeText(ingredient);
    shownCounts.set(key, (shownCounts.get(key) ?? 0) + 1);
  });

  return candidates.filter((candidate) => {
    const key = normalizeText(candidate.text);
    const remainingCount = shownCounts.get(key) ?? 0;
    if (remainingCount === 0) {
      return true;
    }

    shownCounts.set(key, remainingCount - 1);
    return false;
  });
};

const uniqueCandidatesInRecipeOrder = (
  allCandidates: IngredientCandidate[],
  selectedCandidates: IngredientCandidate[]
): IngredientCandidate[] => {
  const selected = new Set(selectedCandidates);
  return allCandidates.filter((candidate) => selected.has(candidate));
};

/**
 * Resolves the ingredient lines that are useful for a single cook-mode step.
 *
 * Direct ingredient names are always included. Collective references can select
 * every ingredient, a named ingredient section, or only ingredients that have
 * not appeared in an earlier step.
 */
export const getCookModeIngredients = (
  ingredients: RecipeItem[],
  instruction: string,
  context: CookModeIngredientContext = {}
): string[] => {
  const candidates = buildCandidates(ingredients);
  if (candidates.length === 0 || !instruction.trim()) {
    return [];
  }

  const exclusionMatch = EXCLUSION_CLAUSE_PATTERN.exec(instruction);
  const possibleExclusionText = exclusionMatch?.[1] ?? "";
  const excludedSections = getExplicitlyReferencedSections(
    candidates,
    possibleExclusionText
  );
  const excludedCandidates = new Set(
    candidates.filter((candidate) =>
      isIngredientInInstruction(candidate.text, possibleExclusionText)
    )
  );
  const hasIngredientExclusion =
    excludedCandidates.size > 0 || excludedSections.size > 0;
  const selectionText =
    exclusionMatch && hasIngredientExclusion
      ? `${instruction.slice(0, exclusionMatch.index)} ${instruction.slice(
          exclusionMatch.index + exclusionMatch[0].length
        )}`
      : instruction;

  const directlyNamed = candidates.filter((candidate) =>
    isIngredientInInstruction(candidate.text, selectionText)
  );
  const explicitlyReferencedSections = getExplicitlyReferencedSections(
    candidates,
    selectionText
  );
  const subsectionScope = getSubsectionScope(
    candidates,
    context.instructionSection
  );
  const hasRemainingReference =
    REMAINING_INGREDIENTS_PATTERN.test(selectionText);
  const hasBroadReference =
    hasRemainingReference ||
    ALL_INGREDIENTS_PATTERN.test(selectionText) ||
    GENERAL_INGREDIENT_REFERENCE_PATTERN.test(selectionText);

  let collectiveCandidates: IngredientCandidate[] = [];

  if (explicitlyReferencedSections.size > 0) {
    collectiveCandidates = candidatesInSections(
      candidates,
      explicitlyReferencedSections
    );
  } else if (hasBroadReference && subsectionScope.size > 0) {
    collectiveCandidates = candidatesInSections(candidates, subsectionScope);
  } else if (hasBroadReference) {
    collectiveCandidates = candidates;
  }

  if (hasRemainingReference) {
    collectiveCandidates = removePreviouslyShown(
      collectiveCandidates,
      context.previouslyShownIngredients ?? []
    );
  }

  let selected = uniqueCandidatesInRecipeOrder(candidates, [
    ...directlyNamed,
    ...collectiveCandidates,
  ]);

  if (hasIngredientExclusion) {
    selected = selected.filter(
      (candidate) =>
        !excludedCandidates.has(candidate) &&
        !(
          candidate.section !== null &&
          excludedSections.has(candidate.section)
        )
    );
  }

  return selected.map((candidate) => candidate.text);
};

/**
 * Resolves one step while carrying ingredient usage forward from earlier steps.
 */
export const getCookModeIngredientsForStep = (
  ingredients: RecipeItem[],
  steps: CookModeStep[],
  currentStepIndex: number
): string[] => {
  if (currentStepIndex < 0 || currentStepIndex >= steps.length) {
    return [];
  }

  const previouslyShownIngredients: string[] = [];

  for (let stepIndex = 0; stepIndex <= currentStepIndex; stepIndex++) {
    const step = steps[stepIndex];
    const stepIngredients = getCookModeIngredients(
      ingredients,
      step.instruction,
      {
        instructionSection: step.subsection,
        previouslyShownIngredients,
      }
    );

    if (stepIndex === currentStepIndex) {
      return stepIngredients;
    }

    previouslyShownIngredients.push(...stepIngredients);
  }

  return [];
};
