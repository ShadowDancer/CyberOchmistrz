import { Cruise, CrewMember, CruiseDayRecipe, MealType } from "../types";
import { DIET_TAGS, DIET_TAG_REGISTRY, DietTag } from "./dietTags";
import { getRecipieDietCategory } from "./recipieData";

// ---------------------------------------------------------------------------
// Report types
// ---------------------------------------------------------------------------

export interface MealCoverage {
  mealType: MealType;
  totalPortions: number;
  totalNeeded: number;
  unfed: CrewMember[];
  missingTagCounts: Record<DietTag, number>;
  surplus: number;
}

export interface DayCoverageReport {
  dayNumber: number;
  meals: MealCoverage[];
  isFullyCovered: boolean;
  hasSurplus: boolean;
}

// ---------------------------------------------------------------------------
// Dinic's max-flow
// ---------------------------------------------------------------------------

interface FlowEdge {
  to: number;
  cap: number;
  rev: number;
}

function addEdge(g: FlowEdge[][], u: number, v: number, cap: number): void {
  g[u].push({ to: v, cap, rev: g[v].length });
  g[v].push({ to: u, cap: 0, rev: g[u].length - 1 });
}

function bfsLevels(g: FlowEdge[][], s: number, t: number): number[] | null {
  const level = new Array<number>(g.length).fill(-1);
  level[s] = 0;
  const queue: number[] = [s];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    for (const e of g[u]) {
      if (e.cap > 0 && level[e.to] === -1) {
        level[e.to] = level[u] + 1;
        queue.push(e.to);
      }
    }
  }
  return level[t] !== -1 ? level : null;
}

function dfsPush(
  g: FlowEdge[][],
  u: number,
  t: number,
  pushed: number,
  level: number[],
  iter: number[]
): number {
  if (u === t) return pushed;
  for (; iter[u] < g[u].length; iter[u]++) {
    const e = g[u][iter[u]];
    if (e.cap > 0 && level[e.to] === level[u] + 1) {
      const d = dfsPush(g, e.to, t, Math.min(pushed, e.cap), level, iter);
      if (d > 0) {
        e.cap -= d;
        g[e.to][e.rev].cap += d;
        return d;
      }
    }
  }
  return 0;
}

function maxFlow(g: FlowEdge[][], s: number, t: number): number {
  let total = 0;
  for (;;) {
    const level = bfsLevels(g, s, t);
    if (!level) return total;
    const iter = new Array<number>(g.length).fill(0);
    for (
      let f = dfsPush(g, s, t, Infinity, level, iter);
      f > 0;
      f = dfsPush(g, s, t, Infinity, level, iter)
    ) {
      total += f;
    }
  }
}

// ---------------------------------------------------------------------------
// Coverage computation
// ---------------------------------------------------------------------------

export function getMealCoverage(
  slotRecipes: CruiseDayRecipe[],
  members: CrewMember[],
  mealSlot: MealType
): MealCoverage {
  const totalNeeded = members.length;
  const totalPortions = slotRecipes.reduce((s, r) => s + r.crewCount, 0);

  if (members.length === 0) {
    return {
      mealType: mealSlot,
      totalPortions,
      totalNeeded: 0,
      unfed: [],
      missingTagCounts: Object.fromEntries(DIET_TAGS.map(t => [t, 0])) as Record<DietTag, number>,
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
      const compatible = member.tags.every(tag => {
        const def = DIET_TAG_REGISTRY[tag as DietTag];
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

  const missingTagCounts = Object.fromEntries(DIET_TAGS.map(t => [t, 0])) as Record<DietTag, number>;
  for (const member of unfed) {
    for (const tag of member.tags) {
      if (tag in missingTagCounts) {
        missingTagCounts[tag as DietTag]++;
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

export function getDayCoverage(
  dayNumber: number,
  recipes: CruiseDayRecipe[],
  members: CrewMember[]
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

  return {
    dayNumber,
    meals,
    isFullyCovered: meals.every(m => m.unfed.length === 0),
    hasSurplus: meals.some(m => m.surplus > 0),
  };
}

export function getCruiseCoverage(cruise: Cruise): DayCoverageReport[] {
  if (cruise.crewMembers.length === 0) return [];

  return cruise.days.map(day =>
    getDayCoverage(day.dayNumber, day.recipes, cruise.crewMembers)
  );
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

export function countCrewWithTag(cruise: Cruise, tag: string): number {
  return cruise.crewMembers.filter(m => m.tags.includes(tag)).length;
}

export function getActiveDietTags(cruise: Cruise): DietTag[] {
  const present = new Set<string>();
  cruise.crewMembers.forEach(m => m.tags.forEach(t => present.add(t)));
  return DIET_TAGS.filter(t => present.has(t));
}

export function getDefaultCrewCount(cruise: Cruise, recipe: CruiseDayRecipe["recipeData"]): number {
  const category = getRecipieDietCategory(recipe);
  switch (category) {
    case 'vegan':
      return cruise.crewMembers.length;
    case 'vegetarian':
      return cruise.crewMembers.length - countCrewWithTag(cruise, 'vegan');
    case 'omnivore':
      return countCrewWithTag(cruise, 'omnivore');
  }
}
