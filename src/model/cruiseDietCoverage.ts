import { Cruise, CrewMember, CruiseDayRecipe, MealType } from "../types";
import { DIET_TAGS, DIET_REGISTRY, DietTagId } from "./dietTags";
import { CrewRecipeAllocationChecker } from "../utils/maxFlow";

// ---------------------------------------------------------------------------
// Report types
// ---------------------------------------------------------------------------

export interface DayCoverageReport {
  dayNumber: number;
  meals: MealCoverage[];
  isFullyCovered: boolean;
  hasSurplus: boolean;
}

export interface MealCoverage {
  mealType: MealType;
  totalPortions: number;
  totalNeeded: number;
  unfed: CrewMember[];
  missingTagCounts: Record<DietTagId, number>;
  surplus: number;
}

// ---------------------------------------------------------------------------
// Coverage computation
// ---------------------------------------------------------------------------

export function getCruiseCoverage(cruise: Cruise): DayCoverageReport[] {
  if (cruise.crewMembers.length === 0) return [];

  return cruise.days.map((day) =>
    getDayCoverage(day.dayNumber, day.recipes, cruise.crewMembers),
  );
}

export function getDayCoverage(
  dayNumber: number,
  recipes: CruiseDayRecipe[],
  members: CrewMember[],
): DayCoverageReport {
  // Group non-snack recipes by mealSlot
  const bySlot = new Map<MealType, CruiseDayRecipe[]>();
  for (const recipe of recipes) {
    if (recipe.mealSlot === MealType.SNACK) continue;
    const list = bySlot.get(recipe.mealSlot) ?? [];
    list.push(recipe);
    bySlot.set(recipe.mealSlot, list);
  }

  const meals: MealCoverage[] = [];
  for (const [slot, slotRecipes] of bySlot) {
    meals.push(getMealCoverage(slotRecipes, members, slot));
  }

  const NON_SNACK_MEALS = [
    MealType.BREAKFAST,
    MealType.DINNER,
    MealType.SUPPER,
  ];
  const presentMealTypes = new Set(meals.map((m) => m.mealType));
  const allNonSnackPresent = NON_SNACK_MEALS.every((t) =>
    presentMealTypes.has(t),
  );

  return {
    dayNumber,
    meals,
    isFullyCovered:
      members.length === 0 ||
      (allNonSnackPresent && meals.every((m) => m.unfed.length === 0)),
    hasSurplus: meals.some((m) => m.surplus > 0),
  };
}

export function getMealCoverage(
  slotRecipes: CruiseDayRecipe[],
  members: CrewMember[],
  mealSlot: MealType,
): MealCoverage {
  const totalNeeded = members.length;
  const totalPortions = slotRecipes.reduce((s, r) => s + r.crewCount, 0);

  if (members.length === 0) {
    return defaultMealCoverage(mealSlot, totalPortions);
  }

  const allocationChecker = new CrewRecipeAllocationChecker(members, slotRecipes, (member, recipe) => {
    return member.tags.every((tag) => {
      const diet = DIET_REGISTRY[tag as DietTagId];
      // Unknown tags are treated as non-restrictive
      return diet === undefined || diet.satisfies(recipe.recipeData);
    })
  });

  const unfed = allocationChecker.getUnfedCrewMembers();

  return {
    mealType: mealSlot,
    totalPortions,
    totalNeeded,
    unfed,
    missingTagCounts: getMissingTagCounts(unfed),
    surplus: Math.max(0, totalPortions - totalNeeded),
  };
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function defaultMealCoverage(mealSlot: MealType, totalPortions: number): MealCoverage {
  return {
    mealType: mealSlot,
    totalPortions,
    totalNeeded: 0,
    unfed: [],
    missingTagCounts: Object.fromEntries(
      DIET_TAGS.map((t) => [t, 0]),
    ) as Record<DietTagId, number>,
    surplus: totalPortions,
  };
}

function getMissingTagCounts(unfed: CrewMember[]): Record<DietTagId, number> {
  const missingTagCounts = Object.fromEntries(
    DIET_TAGS.map((t) => [t, 0]),
  ) as Record<DietTagId, number>;

  for (const member of unfed) {
    for (const tag of member.tags) {
      if (tag in missingTagCounts) {
        missingTagCounts[tag as DietTagId]++;
      }
    }
  }

  return missingTagCounts;
}

export function countCrewWithTag(cruise: Cruise, tag: string): number {
  return cruise.crewMembers.filter((m) => m.tags.includes(tag)).length;
}

export function getActiveDietTags(cruise: Cruise): DietTagId[] {
  const present = new Set<string>();
  cruise.crewMembers.forEach((m) => m.tags.forEach((t) => present.add(t)));
  return DIET_TAGS.filter((t) => present.has(t));
}
