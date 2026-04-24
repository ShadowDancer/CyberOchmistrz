import { Cruise, CrewMember, CruiseDayRecipe, MealType } from "../types";
import { DIET_TAGS, DIET_TAG_REGISTRY, DietTagId } from "./dietTags";
import { maxFlow, addEdge, FlowEdge } from "../utils/maxFlow";

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

  // Node layout:
  //   0         = source
  //   1..M      = member nodes (M = members.length)
  //   M+1..M+R  = recipe nodes (R = slotRecipes.length)
  //   M+R+1     = sink
  const M = members.length;
  const R = slotRecipes.length;
  const source = 0;
  const sink = M + R + 1;
  const nodeCount = sink + 1;

  const g: FlowEdge[][] = Array.from({ length: nodeCount }, () => []);

  // Source → each member (cap 1)
  for (let i = 0; i < M; i++) {
    addEdge(g, source, i + 1, 1);
  }

  // Member → recipe edges (cap 1 each) if recipe satisfies all known tags of member
  for (let i = 0; i < M; i++) {
    const member = members[i];
    for (let j = 0; j < R; j++) {
      const recipe = slotRecipes[j];
      const compatible = member.tags.every((tag) => {
        const def = DIET_TAG_REGISTRY[tag as DietTagId];
        // Unknown tags are treated as non-restrictive
        return def === undefined || def.satisfies(recipe.recipeData);
      });
      if (compatible) {
        addEdge(g, i + 1, M + 1 + j, 1);
      }
    }
  }

  // Recipe → sink (cap = crewCount)
  for (let j = 0; j < R; j++) {
    addEdge(g, M + 1 + j, sink, slotRecipes[j].crewCount);
  }

  maxFlow(g, source, sink);

  // Identify unfed members: source→member_i edge (g[source][i]) still has cap=1 if no flow went through it.
  const unfed: CrewMember[] = [];
  for (let i = 0; i < M; i++) {
    if (g[source][i].cap > 0) {
      unfed.push(members[i]);
    }
  }

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

  const surplus = Math.max(0, totalPortions - totalNeeded);

  return {
    mealType: mealSlot,
    totalPortions,
    totalNeeded,
    unfed,
    missingTagCounts,
    surplus,
  };
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

export function countCrewWithTag(cruise: Cruise, tag: string): number {
  return cruise.crewMembers.filter((m) => m.tags.includes(tag)).length;
}

export function getActiveDietTags(cruise: Cruise): DietTagId[] {
  const present = new Set<string>();
  cruise.crewMembers.forEach((m) => m.tags.forEach((t) => present.add(t)));
  return DIET_TAGS.filter((t) => present.has(t));
}
