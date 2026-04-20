---
name: cruise diet coverage — domain + tests
overview: Model crew as a tagged-member list (extensible tag registry) on a Cruise class with computed `crew`. Each recipe assigned to a day carries an explicit `crewCount` (portions to cook) and a `mealSlot` (which meal type on that day). Shopping list scales each recipe by its own `crewCount`. Per (day, mealSlot) coverage check reports whether the configured scaling satisfies all dietary buckets.
todos:
  - id: tag-registry
    content: Create src/model/dietTags.ts with DietTag type + DIET_TAG_REGISTRY (omnivore default, vegetarian, vegan) mapping to recipe satisfaction predicates
    status: pending
  - id: types-crew
    content: Add CrewMember interface; replace Cruise.crew (number) with Cruise.crewMembers (CrewMember[]); update every call site that read cruise.crew to cruise.crewMembers.length. Cruise stays a plain interface, no class / no getter.
    status: pending
  - id: types-day-recipe
    content: Extend CruiseDay.recipes[i] with crewCount (number) and mealSlot (MealType) as required fields; make recipeData required; update CruiseFormData/Errors for crewMembers
    status: pending
  - id: cruise-data-crud
    content: Update createNewCruise(name, length, crewMembers, startDate); updateCruiseDetails to accept CrewMember[]; addRecipeToCruiseDay to accept crewCount + mealSlot (default smart); add setRecipeCrewCount + setRecipeMealSlot mutators; swap cruise.crew for cruise.crewMembers.length in aggregateShoppingList and any other call sites
    status: pending
  - id: smart-defaults
    content: Add helper getDefaultCrewCount(cruise, recipe) in cruiseDietCoverage.ts — fully-inclusive default (count of crew the recipe could feed). vegan recipe → cruise.crewMembers.length; vegetarian recipe → total minus vegan count; omnivore recipe → countCrewWithTag(cruise, 'omnivore').
    status: pending
  - id: coverage-module
    content: Create src/model/cruiseDietCoverage.ts with max-flow via Dinic's algorithm (level-BFS + blocking-flow DFS with per-node edge cursor); exports MealCoverage, DayCoverageReport, getMealCoverage, getDayCoverage, getCruiseCoverage; over-scaling surfaced as yellow warning; per-tag shortage counts for reporting
    status: pending
  - id: shopping-list
    content: Change aggregateShoppingList to scale by recipe.crewCount (not cruise.crew); update RecipeAmountSource to carry crewCount instead of base amount; extend tests
    status: pending
  - id: tests-coverage
    content: Create test/cruiseDietCoverage.test.ts with allocation/coverage scenarios (table below)
    status: pending
  - id: tests-rehydrate
    content: Extend/create test/cruiseDataRehydrate.test.ts asserting JSON round-trip preserves crewMembers[] and nested days[].recipes[].{crewCount,mealSlot,recipeData}
    status: pending
  - id: tests-shopping
    content: Extend shopping list tests for per-recipe crewCount scaling (e.g. two recipes same day scaled differently; original + modified version of same recipe both on same meal slot)
    status: pending
  - id: tests-form
    content: Extend cruise form validation tests for empty crewMembers
    status: pending
  - id: readme
    content: Update README directory structure (add dietTags.ts, cruiseDietCoverage.ts), features, glossary
    status: pending
isProject: false
---

## Scope

- `Cruise` stays a plain interface. The scalar `crew: number` field is replaced with `crewMembers: CrewMember[]`. Every call site that previously read `cruise.crew` reads `cruise.crewMembers.length`. No class, no getter — keeps `localStorage` rehydration a trivial `JSON.parse` with no prototype gymnastics.
- Crew = `CrewMember[]` where each has optional name + diet tags (strings validated against registry). A member may hold at most one of `{'vegetarian', 'vegan'}` (enforced in `CrewEditor`); future orthogonal tags (e.g. `gluten-free`) would stack additionally.
- Each day-recipe has explicit `crewCount` (portions) and `mealSlot` (which meal on that day).
- Shopping list scales ingredients by each recipe's `crewCount`.
- Coverage check per (day, mealSlot) reports whether configured scaling feeds every dietary bucket.
- Extensible: new tag category (e.g. `gluten-free`) = registry entry + ingredient flag + recipe predicate. No `Cruise`/form/coverage-logic code changes.

## Design

### Tag registry — `src/model/dietTags.ts`

```ts
import { Recipie } from "../types";
import { isRecipieVegan, isRecipieVegetarian } from "./recipieData";

export const DIET_TAGS = ["omnivore", "vegetarian", "vegan"] as const;
export type DietTag = (typeof DIET_TAGS)[number];

export interface DietTagDefinition {
  id: DietTag;
  labelPl: string;
  shortPl: string;
  satisfies: (recipe: Recipie) => boolean;
  /** Tags in the same exclusiveGroup cannot coexist on a single CrewMember. */
  exclusiveGroup?: string;
  /** If true, this tag is assigned to new crew members by default. */
  isDefault?: boolean;
}

export const DIET_TAG_REGISTRY: Record<DietTag, DietTagDefinition> = {
  omnivore: {
    id: "omnivore",
    labelPl: "wszystkożerna",
    shortPl: "Omni.",
    satisfies: () => true, // omnivores can eat any recipe
    exclusiveGroup: "diet",
    isDefault: true,
  },
  vegetarian: {
    id: "vegetarian",
    labelPl: "wegetariańska",
    shortPl: "Weget.",
    satisfies: isRecipieVegetarian,
    exclusiveGroup: "diet",
  },
  vegan: {
    id: "vegan",
    labelPl: "wegańska",
    shortPl: "Wegan.",
    satisfies: isRecipieVegan,
    exclusiveGroup: "diet",
  },
};

export function isKnownDietTag(tag: string): tag is DietTag {
  return tag in DIET_TAG_REGISTRY;
}
```

Notes:

- `isRecipieVegan(r) ⇒ isRecipieVegetarian(r)` by the ingredient-model invariant (`isVegan ⇒ isVegetarian` per ingredient), so `vegetarian.satisfies = isRecipieVegetarian` already covers both.
- `exclusiveGroup: 'diet'` on all three tags expresses the "at most one of {omnivore, vegetarian, vegan} per member" rule as data; `CrewEditor` reads it to hide/disable conflicting chips. A future `gluten-free` tag would omit `exclusiveGroup` (orthogonal) and stack freely.
- `isDefault: true` on `omnivore` means `CrewEditor` pre-selects it when creating a new member. New members always carry exactly one diet tag.

Future tags (e.g. `gluten-free`) add an entry here plus a matching ingredient flag and recipe predicate. Coverage algorithm is unchanged.

### Types — `src/types/index.ts`

```ts
export interface CrewMember {
  id: string;
  name?: string; // omitted = anonymous; no validation beyond that
  tags: string[]; // string[] not DietTag[] so unknown tags round-trip; CrewEditor enforces exclusiveGroup constraints on known tags; new members default to ['omnivore']
}

// CruiseDay recipe entry:
export interface CruiseDayRecipe {
  originalRecipeId: string;
  recipeData: Recipie; // required: snapshot taken at add-time, always present after this change
  crewCount: number;
  mealSlot: MealType;
}
export interface CruiseDay {
  dayNumber: number;
  recipes: CruiseDayRecipe[];
}

// Shopping-list source gains crewCount for tooltip / breakdown display:
export class RecipeAmountSource {
  readonly type = "recipe" as const;
  constructor(
    public amount: number, // base amount before crew scaling
    public recipeName: string | undefined,
    public dayNumber: number | undefined,
    public crewCount: number, // NEW: portions scaled for this day-recipe
  ) {}
}
```

`Cruise` interface: swap the `crew: number` field for `crewMembers: CrewMember[]`:

```ts
export interface Cruise {
  id: string;
  name: string;
  dateCreated: string;
  dateModified: string;
  length: number;
  crewMembers: CrewMember[]; // was: crew: number
  days: CruiseDay[];
  additionalSupplies?: CruiseSupply[];
  startDate?: string;
}
```

Every read of `cruise.crew` in the codebase becomes `cruise.crewMembers.length`. Known current sites:

- [src/model/cruiseData.ts](src/model/cruiseData.ts) `aggregateShoppingList` — ingredient scaling and `isPerPerson` multiplier for additional supplies
- [src/model/cruiseData.ts](src/model/cruiseData.ts) `createNewCruise(name, length, crew, ...)` signature becomes `createNewCruise(name, length, crewMembers, ...)`
- [src/model/cruiseData.ts](src/model/cruiseData.ts) `updateCruiseDetails` — `crew` param becomes `crewMembers`
- [src/model/cruiseData.ts](src/model/cruiseData.ts) `validateCruiseForm` — `formData.crew` rules move to `formData.crewMembers.length`
- All UI surfaces displaying "Liczba załogantów: {cruise.crew}" — replace with `crewMembers.length`

No class, no prototype, so `JSON.stringify` / `JSON.parse` round-trip is trivial and spreads like `{ ...cruise, dateModified: ... }` remain safe.

`CruiseFormData` / `CruiseFormErrors` swap `crew: number` → `crewMembers: CrewMember[]` / `crewMembers: string` error.

### Coverage algorithm (max-flow via Dinic's algorithm)

Pure functions in `src/model/cruiseDietCoverage.ts`. Per (day, mealSlot), the check answers: "is there an assignment of one portion per crew member such that each member only eats from recipes compatible with every one of their tags, and no recipe exceeds its `crewCount`?"

Modeled as a flow network with 4 layers:

```
            cap=1            edge iff                 cap=crewCount
 Source ─────────▶ Member ─────────────────▶ Recipe ──────────────────▶ Sink
                  (per crew    (recipe satisfies
                   member)      every tag member holds)
```

- Source → member edges: capacity 1 (each member eats one portion)
- Member → recipe edges: exist iff `member.tags.every(t => DIET_TAG_REGISTRY[t]?.satisfies(recipe.recipeData) ?? true)`; capacity 1 (unknown tags are treated as non-restrictive to avoid false negatives)
- Recipe → sink edges: capacity = `recipe.crewCount`

Run Dinic's algorithm:

1. BFS from `source` to compute `level[v]` = shortest-edge distance to `v` on the residual graph.
2. DFS from `source` pushing flow only along edges `(u, v)` where `level[v] === level[u] + 1` (level graph). Use a per-node `iter[u]` cursor so saturated edges aren't rescanned in the same phase.
3. Repeat BFS/DFS until the sink is unreachable.

Meal is fully covered iff `maxFlow === crewMembers.length`. Problem size is trivially small (at most a few dozen crew + handful of recipes per meal), so worst-case Dinic's complexity is not a concern.

If `maxFlow < crewMembers.length`, identify unfed members: BFS from source on the residual graph — members still reachable are those who couldn't be assigned. Dinic's terminates in the same residual-graph state as Ford-Fulkerson, so this reporting trick is identical.

Why Dinic's (over Hopcroft-Karp / Ford-Fulkerson):

- Natively handles `crewCount > 1` without duplicating recipe nodes (Hopcroft-Karp requires unit capacities).
- Graceful upgrade path to min-cost max-flow if future work introduces preferences/costs.

Correctness: max-flow is exact. Handles chain relations (vegan ⊂ vegetarian) and orthogonal tags (future gluten-free) uniformly. No ordering heuristics needed.

Surplus detection: `totalPortions = sum(r.crewCount)`, `totalNeeded = crewMembers.length`. If `totalPortions > totalNeeded`, include `surplus = totalPortions - totalNeeded` as yellow warning (informational, not error).

Snacks still excluded from coverage (meal type not checked).

Pseudocode sketch:

```ts
interface FlowEdge {
  to: number;
  cap: number;
  rev: number;
}

function addEdge(g: FlowEdge[][], u: number, v: number, cap: number): void {
  g[u].push({ to: v, cap, rev: g[v].length });
  g[v].push({ to: u, cap: 0, rev: g[u].length - 1 });
}

// Level BFS: level[v] = distance from s in the residual graph. Returns null if t unreachable.
function bfsLevels(g: FlowEdge[][], s: number, t: number): number[] | null {
  /* ... */
}

// DFS pushes up to `pushed` units along strictly-increasing-level edges; returns units actually pushed.
function dfsPush(
  g: FlowEdge[][],
  u: number,
  t: number,
  pushed: number,
  level: number[],
  iter: number[],
): number {
  /* ... */
}

function maxFlow(g: FlowEdge[][], s: number, t: number): number {
  let total = 0;
  for (;;) {
    const level = bfsLevels(g, s, t);
    if (!level) return total;
    const iter = new Array(g.length).fill(0);
    for (
      let f = dfsPush(g, s, t, Infinity, level, iter);
      f > 0;
      f = dfsPush(g, s, t, Infinity, level, iter)
    ) {
      total += f;
    }
  }
}

export function getMealCoverage(
  slotRecipes: CruiseDayRecipe[],
  members: CrewMember[],
  mealSlot: MealType,
): MealCoverage {
  /* build graph, run maxFlow, find unfed via residual BFS, format */
}
```

~100 lines total in the pure-logic file (graph build + level BFS + blocking-flow DFS + unfed-reporting).

### Report shape

```ts
export interface MealCoverage {
  mealType: MealType;
  totalPortions: number;
  totalNeeded: number;
  unfed: CrewMember[]; // members who couldn't be assigned a portion
  missingTagCounts: Record<DietTag, number>; // e.g. { vegan: 1 }; derived from unfed for UI summary
  surplus: number;
}

export interface DayCoverageReport {
  dayNumber: number;
  meals: MealCoverage[]; // only meal-slots with ≥1 non-snack recipe
  isFullyCovered: boolean; // meals.every(m => m.unfed.length === 0)
  hasSurplus: boolean; // meals.some(m => m.surplus > 0)
}
```

Flat `unfed: CrewMember[]` list reuses the existing type directly — no parallel struct. `missingTagCounts` summary is sufficient given the current registry (three tags in a single exclusive group, at most one per member). When a second orthogonal tag category lands, extend the report shape then — not speculatively now.

### Helper functions in `cruiseDietCoverage.ts`

```ts
export function countCrewWithTag(cruise: Cruise, tag: string): number {
  return cruise.crewMembers.filter((m) => m.tags.includes(tag)).length;
}

export function getActiveDietTags(cruise: Cruise): DietTag[] {
  const present = new Set<string>();
  cruise.crewMembers.forEach((m) => m.tags.forEach((t) => present.add(t)));
  return DIET_TAGS.filter((t) => present.has(t));
}
```

### Smart default `crewCount` on recipe add — fully inclusive

Helper `getDefaultCrewCount(cruise, recipe)` in `cruiseDietCoverage.ts`:

- Compute recipe diet category via `getRecipieDietCategory(recipe)` (new helper in `recipieData.ts`): `'vegan' | 'vegetarian' | 'omnivore'`
- Default = number of crew members the recipe **could** feed (inclusive upper bound):
  - `vegan` recipe satisfies everyone → `cruise.crewMembers.length`
  - `vegetarian` (non-vegan) recipe satisfies omnivores + vegetarians but not strict vegans → `cruise.crewMembers.length - countCrewWithTag(cruise, 'vegan')`
  - `omnivore` recipe satisfies only crew tagged `omnivore` → `countCrewWithTag(cruise, 'omnivore')`
- Rationale: a vegan recipe is usually added as a crowd-pleaser, not to feed the single vegan. Defaulting to "everyone who could eat it" matches intent. Over-scaling triggers a yellow surplus warning but never a red failure, so the default is safe to err on the side of inclusion. User still edits freely.

### Shopping list — `src/model/cruiseData.ts`

```ts
cruise.days.forEach((day) => {
  day.recipes.forEach((recipe) => {
    const { recipeData } = recipe; // always defined now
    recipeData.ingredients.forEach((ing) => {
      const scaledAmount = ing.amount * recipe.crewCount; // was: cruise.crew
      const source = new RecipeAmountSource(
        ing.amount,
        recipeData.name,
        day.dayNumber,
        recipe.crewCount,
      );
      addToItemsMap(itemsMap, supply, scaledAmount, source);
    });
  });
});
```

Tooltip / breakdown UI in [src/components](src/components) (wherever `RecipeAmountSource.amount` is currently rendered) must be updated to show "× {crewCount}" so users can see why a quantity is what it is.

Additional supplies scaling logic is structurally unchanged, but the `isPerPerson` multiplier swaps `cruise.crew` → `cruise.crewMembers.length`:

```ts
const crewMultiplier = item.isPerPerson ? cruise.crewMembers.length : 1;
const dayMultiplier = item.isPerDay ? cruise.length : 1;
```

### Rehydration — `src/model/cruiseData.ts`

Nothing to do. `Cruise` is plain data, so the existing `JSON.parse` in `getCruises` and `JSON.stringify` in `saveCruise` work unchanged. Greenfield: localStorage may be cleared; no migration logic.

All persisted cruises written by this version contain `crewMembers[]` and day recipes with `crewCount` + `mealSlot` + `recipeData` — required fields, written by `createNewCruise` + `addRecipeToCruiseDay`.

### Coverage recomputation

Pure function; N is tiny; no caching layer needed. Call `getCruiseCoverage(cruise)` (returns `DayCoverageReport[]`) from a `useMemo` keyed on the `cruise` object reference inside the cruise detail page. Re-runs naturally whenever the `cruise` reference changes, which happens on:

- Cruise detail page load (initial `getCruiseById`)
- Switching into the menu tab (tab mount re-reads / passes cruise down)
- Adding / removing / editing / moving a recipe on any day
- Changing `crewCount` or `mealSlot` on an existing day-recipe
- Changing crew members (add / remove / rename / retag) — the edit flow reloads the cruise

Every mutator in [src/model/cruiseData.ts](src/model/cruiseData.ts) already calls `saveCruise` + the caller re-reads via `getCruiseById`, so this falls out naturally — no extra wiring required.

### Tests

**`test/cruiseDietCoverage.test.ts`** — table scenarios:

| crew                                     | recipes on obiad (mealSlot=obiad, crewCount)                                                | expected                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 5 omni                                   | Spaghetti omni ×5                                                                           | covered                                                                                           |
| 5 omni, 1 vegan                          | Spaghetti omni ×5, Tofu vegan ×1                                                            | covered                                                                                           |
| 5 omni, 1 vegan                          | Spaghetti omni ×6                                                                           | missing vegan ×1                                                                                  |
| 5 omni, 1 vegan                          | Tofu vegan ×6                                                                               | covered (vegan recipe feeds omnis)                                                                |
| 5 omni, 2 veg, 1 vegan                   | Stir-fry vegan ×1, Pasta veg ×2, Steak omni ×5                                              | covered (max-flow assigns vegan→stir-fry, veg→pasta, omni→steak)                                  |
| 5 omni, 2 veg, 1 vegan                   | Stir-fry vegan ×1, Pasta veg ×1, Steak omni ×6                                              | missing 1 pure veg (pasta only 1 portion, 2 pure veg, stir-fry eaten by vegan)                    |
| 3 omni                                   | Soup omni ×5                                                                                | surplus 2 (warning)                                                                               |
| 0 total                                  | —                                                                                           | no report rows                                                                                    |
| snack recipes only                       | Cookie snack ×5                                                                             | meal not included in coverage                                                                     |
| 1 vegan                                  | modified Bolognese (meat→tofu, vegan recipeData) ×2                                         | covered (reclassified via ingredient flags)                                                       |
| 2 omni                                   | Eggs [mealType=breakfast+supper, mealSlot=breakfast] ×2                                     | counts only toward breakfast coverage; obiad slot has no entry                                    |
| 1 omni, 1 crew with unknown tag 'halal'  | Steak omni ×2                                                                               | no false missing; unknown tag ignored (not in registry)                                           |
| **Dinic's correctness**: 3 vegans        | Tofu A (vegan) ×2, Tofu B (vegan) ×1                                                        | covered (algorithm finds valid assignment splitting across both)                                  |
| **original + modified**: 3 omni, 2 vegan | Bolognese (omni recipeData) ×3, Bolognese-tofu (vegan recipeData, same originalRecipeId) ×2 | covered; unfed=[]; surplus=0 (1:1 mapping: omni bucket eats original, vegan bucket eats modified) |

**`test/cruiseDataRehydrate.test.ts`** — new (lightweight regression check):

- `JSON.parse(JSON.stringify(cruise))` preserves `crewMembers[]` (including per-member `id`/`name`/`tags`)
- Round-trip preserves nested `days[].recipes[].{crewCount, mealSlot, recipeData}` as required fields
- `cruise.crewMembers.length` after round-trip equals the original crew count (guards anyone accidentally reintroducing a `crew: number` scalar)

**Shopping list tests** — extend:

- Two recipes on same day with different `crewCount` scale ingredients independently
- Original and modified versions of the same recipe (identical `originalRecipeId`, different `recipeData` snapshots) on the same meal slot each contribute their own ingredients × their own `crewCount` to the aggregated list
- Recipe with `crewCount=0` contributes nothing

**Form validation** — extend:

- Empty `crewMembers` → error
- `crewMembers.length >= 100` → error
- `CrewMember` with no name and `tags: ['omnivore']` (the default) is valid (anonymous omnivore)
- `CrewMember` cannot hold two tags from the same `exclusiveGroup` (e.g. both `vegetarian` and `vegan`, or `omnivore` and `vegan`) — UI prevents, model-level guard in `CrewEditor` save path

**Smart default `crewCount`** — new:

- vegan recipe + mixed crew → default equals total crew size (fully inclusive)
- vegetarian (non-vegan) recipe + crew with vegans → default equals `total - vegan count`
- omnivore recipe + mixed crew → default equals `countCrewWithTag(cruise, 'omnivore')`
- defaults against empty/zero buckets → return `0` cleanly

### README

- Directory structure: add `src/model/dietTags.ts`, `src/model/cruiseDietCoverage.ts`
- Features: mention per-recipe scaling + diet-aware coverage with extensible tag registry
- Polish glossary: add `dieta wegetariańska`, `dieta wegańska`, `wszystkożerna`, `załogant`

## Backward compatibility

Not a concern. Greenfield development — any localStorage data predating this change is expected to be cleared or discarded. `Cruise` storage shape is defined solely by this version.

## Risks

- **Missed `cruise.crew` call sites** after the field rename. Mitigation: compiler catches them — `cruise.crew` is no longer a property, so every surviving read becomes a type error. Grep audit as a belt-and-braces check.
- **Max-flow implementation correctness**: hand-rolled Dinic's (level BFS + blocking-flow DFS); covered by table-driven tests including the `crewCount > 1` split row and the original-plus-modified-recipe row.
- **Recipe with multiple mealTypes**: user must pick `mealSlot` on add. Auto-pick when only one mealType.
- **Form complexity**: `CrewEditor` is a significant new UI component (covered in the UI plan).

## Out of scope

- Adding `gluten-free` tag in this change (registry designed to accept it; unavoidable `Ingredient.isGlutenFree` data work deferred)
- Automatic reassignment of `crewCount` when crew composition changes (user re-edits manually; warning via coverage)
- Flagging days missing a meal type entirely (e.g. no obiad at all)
- Per-member allergies / medical notes beyond tags
- Collaborative / multi-device sync
