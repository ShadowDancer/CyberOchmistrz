---
name: cruise diet coverage — UI
overview: Model crew as a tagged-member list (extensible tag registry) on a Cruise class with computed `crew`. Each recipe assigned to a day carries an explicit `crewCount` (portions to cook) and a `mealSlot` (which meal type on that day). Shopping list scales each recipe by its own `crewCount`. Per (day, mealSlot) coverage check reports whether the configured scaling satisfies all dietary buckets.
todos:
  - id: crew-editor
    content: Create src/components/CrewEditor.tsx with member list + tag chips + quick-add buttons
    status: pending
  - id: forms
    content: Replace crew number input with CrewEditor in AddCruiseForm + EditCruiseForm; wire to crewMembers[]
    status: pending
  - id: day-recipe-ui
    content: In CruiseMenuTab (or extracted day recipe card component), add crewCount input and mealSlot selector per recipe on a day; wire to setRecipeCrewCount/setRecipeMealSlot
    status: pending
  - id: add-recipe-flow
    content: When user drops/picks a recipe onto a day, auto-assign mealSlot when recipe has a single mealType; prompt (small modal or inline selector) when multiple; compute smart default crewCount
    status: pending
  - id: coverage-display
    content: Render per-meal-slot coverage block under Dzień {N} header; green/red/yellow lines per bucket; red dot warning on DroppableDayItem day card
    status: pending
  - id: info-tab
    content: CruiseInfoTab shows crew total + per-tag counts + omnivore remainder + optional collapsible member list
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

### UI

**`CrewEditor.tsx`** (new): list of rows `[name?] [tag chips] [×]` + quick-add buttons (single member, N omnivores, vegetarian, vegan).

- Tag chips enforce `exclusiveGroup` from the registry: picking `wegan` disables/clears `wegetarianin` and vice versa. Unknown persisted tags render as read-only chips (not editable, not dropped).
- Anonymous members (no name) allowed. A row with no name and no tags counts as one omnivore.
- Summary line: `total` + per-known-tag count + omnivore remainder (`total - sum(known-tag counts)`). Since `exclusiveGroup: 'diet'` guarantees at most one of {vegetarian, vegan} per member, these counts partition the crew cleanly.

**Forms** (`AddCruiseForm`, `EditCruiseForm`): swap crew number input for `CrewEditor`.

**`CruiseMenuTab.tsx`** center panel, "Dzień {N}":

- Coverage block per meal-slot with recipes: green "pokryte" when `unfed.length === 0 && surplus === 0`; otherwise show a red unfed section ("Niedobór: Anna (wegan), Celina (wegan)") and/or a yellow surplus line ("Nadmiar: 2 porcje"). Both can appear simultaneously.
- Recipe cards show editable `crewCount` (including `0`, rendered with a muted warning so the user can bump it up rather than having the card hidden) and `mealSlot` selector.
- Recipes assigned to `mealSlot = SNACK` render with a muted notice ("Przekąski nie wliczają się do pokrycia diety") so users don't expect coverage warnings for snack-slot recipes.
- Recipe card example:

  ```
  Spaghetti bolognese   [obiad ▼]  [−] 5 [+]   ✎  🗑
  ```

**Add recipe flow**: on drop/click-add, if recipe has 1 mealType → auto-assign `mealSlot`. If multiple → inline prompt / small modal asking which meal. Smart default `crewCount` populated (fully-inclusive; see above).

**`DroppableDayItem.tsx`** day-level dot (mirrors per-meal-slot dots):

- `unfed > 0` → red dot (regardless of surplus). Tooltip lists first unfed member + "i N innych" if more.
- `unfed === 0 && surplus > 0` → yellow dot. Tooltip: "Nadmiar: N porcji".
- `unfed === 0 && surplus === 0` → no dot.

The same red-overrides-yellow rule applies at the meal-slot level, but the detail panel still shows both the red unfed list **and** the yellow surplus line when both are present — the dots are a summary, the panel is authoritative.

**`CruiseInfoTab.tsx`**: replace "Liczba załogantów: N" with summary block + per-tag counts + omnivore remainder + optional collapsible member list.

## Risks

- **Recipe with multiple mealTypes**: user must pick `mealSlot` on add. Auto-pick when only one mealType.
- **Form complexity**: `CrewEditor` is the biggest new UI component. Quick-add buttons mitigate bulk entry.

## Out of scope

- Adding `gluten-free` tag in this change (registry designed to accept it; unavoidable `Ingredient.isGlutenFree` data work deferred)
- Automatic reassignment of `crewCount` when crew composition changes (user re-edits manually; warning via coverage)
- Flagging days missing a meal type entirely (e.g. no obiad at all)
- Per-member allergies / medical notes beyond tags
- Collaborative / multi-device sync
