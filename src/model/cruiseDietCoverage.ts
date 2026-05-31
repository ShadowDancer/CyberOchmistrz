import { CrewMember, Diet } from "./crew";
import { isRecipieVegan, isRecipieVegetarian } from "./recipieData";
import { CrewRecipeAllocationChecker } from "../utils/maxFlow";
import { Cruise, CruiseDayRecipe } from "./cruise";
import { MealType, Recipie } from "./recipe";

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
  forbiddenIngredientCounts: Record<string, number>;
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
  slotRecipes: readonly CruiseDayRecipe[],
  members: readonly CrewMember[],
  mealSlot: MealType,
): MealCoverage {
  const totalNeeded = members.length;
  const totalPortions = slotRecipes.reduce((s, r) => s + r.crewCount, 0);

  if (members.length === 0) {
    return defaultMealCoverage(mealSlot, totalPortions);
  }

  const allocationChecker = new CrewRecipeAllocationChecker(members, slotRecipes, (member, recipe) => {
    return canEat(member, recipe.recipeData);
  });

  const unfed = allocationChecker.getUnfedCrewMembers();

  return {
    mealType: mealSlot,
    totalPortions,
    totalNeeded,
    unfed,
    forbiddenIngredientCounts: getForbiddenIngredientCounts(unfed, slotRecipes.map(r => r.recipeData)),
    surplus: Math.max(0, totalPortions - totalNeeded),
  };
}

export function canEat(member: CrewMember, recipe: Recipie): boolean {
  return dietMatches(member, recipe)
    && !hasExcludedIngredients(member, recipe);
}

function dietMatches(member: CrewMember, recipe: Recipie): boolean {
  switch (member.diet) {
    case "omnivore":   return true;
    case "vegetarian": return isRecipieVegetarian(recipe);
    case "vegan":      return isRecipieVegan(recipe);
  }
}

function hasExcludedIngredients(member: CrewMember, recipe: Recipie): boolean {
  return recipe.ingredients.some(ing => member.excludedSupplies?.includes(ing.id));
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
    forbiddenIngredientCounts: {},
    surplus: totalPortions,
  };
}

function getForbiddenIngredientCounts(
  unfed: CrewMember[],
  slotRecipes: Recipie[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  const slotIngredientIds = new Set(slotRecipes.flatMap(r => r.ingredients.map(i => i.id)));
  for (const member of unfed) {
    for (const id of member.excludedSupplies ?? []) {
      if (slotIngredientIds.has(id)) {
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }
  }
  return counts;
}

export function countCrewWithTag(cruise: Cruise, tag: string): number {
  return cruise.crewMembers.filter((m) => m.diet === tag).length;
}

export function getActiveDietTags(cruise: Cruise): Diet[] {
  const present = new Set<Diet>();
  cruise.crewMembers.forEach((m) => present.add(m.diet));
  const DIET_VALUES: Diet[] = ["omnivore", "vegetarian", "vegan"];
  return DIET_VALUES.filter((t) => present.has(t));
}
