# Plan: Cruise Diet Coverage UI

## Context

Data model is complete: `crewMembers: CrewMember[]`, `CruiseDayRecipe.crewCount`, `CruiseDayRecipe.mealSlot`, `getDayCoverage`/`getCruiseCoverage` all exist. This plan is purely UI work — connecting the existing model to visible controls and displays.

## Decisions

| Decision | Choice |
|---|---|
| Default crewCount on add | `cruise.crewMembers.length` (total crew) |
| Slot sections in day panel | Always show all 4 (BREAKFAST/DINNER/SUPPER/SNACK), even empty |
| Drop-to-slot behavior | Only matching slot sections accept catalog drops; non-matching grayed out |
| Cross-slot drag | Enabled — drag existing recipe from one slot section to another changes mealSlot |
| mealSlot selector on card | **None** — slot determined by drop target |
| Click-add | **Removed** — drag-only |
| New crew member tags | `[]` (empty — no auto-omnivore chip) |
| Quick-add buttons | None — single "Dodaj załoganta" button |
| Omnivore chip | Explicit, must be added manually |
| Coverage block position | Below recipe cards for that slot |
| Coverage when crew = 0 | Show neutral "Brak załogi — Dodaj załogantów..." message |
| CruiseInfoTab member list | Collapsible |
| EditCruiseForm crew | Load existing `crewMembers[]` into CrewEditor, no destruction |
| AddCruiseForm initial crew | Start empty |
| Min crewCount | 1 |
| CrewEditor placement | Embedded in form |

---

## Tasks (in order)

### 1. Model additions — `src/model/cruiseData.ts`

Add two functions:

```ts
updateRecipeCrewCount(cruiseId: string, dayNumber: number, recipeIndex: number, count: number): void
updateRecipeMealSlot(cruiseId: string, dayNumber: number, recipeIndex: number, mealSlot: MealType): void
```

Pattern: read cruise → mutate `days[dayIdx].recipes[recipeIndex]` → save → update `dateModified`.

---

### 2. `CrewEditor.tsx` (new) — `src/components/CrewEditor.tsx`

```
┌─ Załoga ──────────────────────────────────────────────┐
│ [Imię (opcjonalne)______] [Omni.][Weget.] [×]         │
│ [Anna___________________] [Wegan.]        [×]         │
│ [________________________]                [×]         │
├───────────────────────────────────────────────────────┤
│ 3 osób · 1 wegetarian · 1 wegan · 1 wszystkożernych  │
│ [+ Dodaj załoganta]                                   │
└───────────────────────────────────────────────────────┘
```

Props: `members: CrewMember[], onChange: (members: CrewMember[]) => void`

- List of rows: `[name input (optional)] [tag chips] [× remove]`
- Tag chips: all 3 from `DIET_REGISTRY` (omnivore/vegetarian/vegan). Picking a tag in `exclusiveGroup` clears others in that group. Unknown tags (not in `DIET_REGISTRY`) render as read-only grey chips.
- "Dodaj załoganta" → appends `{ id: crypto.randomUUID(), tags: [] }` (no default tag — user adds explicitly)
- Summary line: `{total} osób | {veg} wegetarian | {vegan} wegan | {omnivore remainder} wszystkożernych`
  - Omnivore remainder = `total - vegCount - veganCount` (members without veg/vegan tag treated as omnivore for counting)
  - Compute inline (can't use `countCrewWithTag` which takes `Cruise`, not `CrewMember[]`)

---

### 3. `EditCruiseForm.tsx` — replace crew number input

- `formData.crew: number` → `formData.crewMembers: CrewMember[]`
- Initialize from `cruise.crewMembers` (preserves existing members)
- Replace number input with `<CrewEditor members={formData.crewMembers} onChange={...} />`
- Validation: `crewMembers.length >= 1`
- `handleSubmit`: pass `formData.crewMembers` directly, no rebuilding

---

### 4. `AddCruiseForm.tsx` — replace crew number input

- Same pattern as EditCruiseForm
- Initial state: `crewMembers: []`

---

### 5. `DraggableRecipeItem.tsx` — add crewCount control, remove mealSlot

```
┌──────────────────────────────────────────────────────┐
│ ⣿  Spaghetti bolognese          [−] 5 [+]  ✎  🗑   │
└──────────────────────────────────────────────────────┘
```

- Update props to accept full `CruiseDayRecipe` (needs `mealSlot` in sortable data, not for display)
- Add callback: `onCrewCountChange(dayNumber, index, count)`
- Remove: `onMealSlotChange`, mealSlot `<select>`, mealType display text, yellow indicator
- New layout: `[drag handle] [recipe name] [−] {crewCount} [+] [Edytuj składniki] [Usuń]`
- Min crewCount = 1 (disable `−` at 1)
- Sortable data must include `mealSlot` so `handleDragEnd` can detect cross-slot moves

---

### 6. `DroppableRecipieContainer.tsx` — slot sections + coverage blocks

**Big change from current flat SortableContext.**

New structure — 4 slot sections always rendered in order: BREAKFAST → DINNER → SUPPER → SNACK:

```
── Śniadanie ────────────────────────────────────────
  ┌──────────────────────────────────────────────┐
  │ ⣿  Owsianka                [−] 8 [+]  ✎  🗑 │
  └──────────────────────────────────────────────┘
  ✓ Pokryte                                 (green)

── Obiad ────────────────────────────────────────────
  ┌──────────────────────────────────────────────┐
  │ ⣿  Spaghetti bolognese     [−] 5 [+]  ✎  🗑 │
  └──────────────────────────────────────────────┘
  ✗ Niedobór: Anna (wegan), Celina (wegan)   (red)
  ⚠ Nadmiar: 2 porcje                       (yellow, alongside red)

── Kolacja ──────────────────────────────────────────
  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
       Przeciągnij przepis tutaj
  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
  ○ Brak załogi — Dodaj załogantów...      (grey, when crew=0)

── Przekąski ─────────── nie wliczają się do pokrycia
  ┌──────────────────────────────────────────────┐
  │ ⣿  Jabłko z masłem orzech. [−] 8 [+]  ✎  🗑 │
  └──────────────────────────────────────────────┘
  (no coverage block)
```

Each slot section:
- Own `useDroppable({id: 'day-slot-{dayNumber}-{MealType}'})` wrapping the section
- Own `SortableContext` with items = recipes in that slot (by their global index in `day.recipes[]`)
- Grayed out (`opacity-40 pointer-events-none`) when `activeDragMealTypes !== null && !activeDragMealTypes.includes(slotMealType)`

Props:
```ts
crewMembers: CrewMember[]
activeDragMealTypes: MealType[] | null   // null = dragging existing recipe (all slots valid)
onCrewCountChange: (dayNumber: number, index: number, count: number) => void
```

CoverageBlock per non-SNACK slot:
- `getMealCoverage(slotRecipes, crewMembers, slot)` from `src/model/cruiseDietCoverage.ts`
- `crewMembers.length === 0` → neutral grey "Brak załogi — Dodaj załogantów, aby sprawdzić pokrycie diety"
- `unfed.length === 0 && surplus === 0` → green "Pokryte ✓"
- `unfed.length > 0` → red "Niedobór: {member.name ?? 'anonimowy'} ({tag}), ..."
- `surplus > 0` → yellow "Nadmiar: {surplus} porcji" (shown alongside red if both)

---

### 7. `CruiseMenuTab.tsx` — wire everything, refactor drag logic

**Remove click-add:**
- Remove `handleRecipieSelect` body logic (or pass no-op to `RecipeList`)
- Remove `selectedRecipie` state

**Drag-add flow (catalog → slot section):**
- `activeDragMealTypes`: when `activeId.startsWith('catalog-')`, extract from `active.data.current.recipeData.mealType[]`, pass to `DroppableRecipieContainer`
- `handleDragEnd` for `catalog-recipe` type: parse overId `day-slot-{day}-{MealType}` → extract slot → `addRecipeToCruiseDay(..., cruise.crewMembers.length, parsedMealSlot)`
- Reject drop if `overId` doesn't match `day-slot-*` pattern (graying handles visual, logic handles enforcement)

**Cross-slot drag (existing recipe → different slot):**
- `handleDragEnd`: if `activeData.type === 'recipe'` and over is `day-slot-{day}-{MealType}` with different slot → call `updateRecipeMealSlot(cruise.id, dayNumber, recipeIndex, newMealSlot)`
- If over is a recipe card in different slot (`overData.mealSlot !== activeData.mealSlot`) → call `updateRecipeMealSlot` + position after target

**Within-slot reorder:**
- Same slot → call `reorderRecipesInCruiseDay` as before

**crewCount change:**
- Add handler calling `updateRecipeCrewCount` then `onCruiseChange()`

**Day-level dots:**
- `getCruiseCoverage(cruise)` → map by `dayNumber` → pass `coverageReport` to each `DroppableDayItem`

---

### 8. `DroppableDayItem.tsx` — status dot

```
┌──────────────────────────────────────┐
│ Dzień 3 ●              3 przepisy    │  ← ● red dot (unfed exist)
│ 12.03 środa                          │
│ • Owsianka                           │
│ • Spaghetti bolognese                │
│ + 1 więcej...                        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Dzień 4 ●              2 przepisy    │  ← ● yellow dot (surplus only)
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ Dzień 5                1 przepis     │  ← no dot (fully covered)
└──────────────────────────────────────┘
```

- Add prop: `coverageReport?: DayCoverageReport`
- Render colored dot (`w-2 h-2 rounded-full`) next to "Dzień {N}":
  - any `meal.unfed.length > 0` → red, `title`: first unfed name + " i N innych"
  - all unfed = 0 && any `meal.surplus > 0` → yellow, `title`: "Nadmiar: N porcji"
  - else → no dot

---

### 9. `CruiseInfoTab.tsx` — crew summary + collapsible list

```
┌─ Parametry rejsu ──────────────────────────────────┐
│ Data rozpoczęcia:  12.03.2025                       │
│ Długość rejsu:     7 dni                            │
│ Załoga:            8 osób                           │
│                    • 5 wszystkożernych              │
│                    • 2 wegetarian                   │
│                    • 1 weganin                      │
│                    [Pokaż członków załogi ▼]        │
│                      Anna — wegetariańska           │
│                      Bartek — wegańska              │
│                      (anonimowy) — brak diety       │
│                      ...                            │
└────────────────────────────────────────────────────┘
```

Replace "Liczba załogantów: N osób" row with crew card:

- Count per tag inline
- Omnivore remainder = `total - vegCount - veganCount`
- Member without tags displays as "brak diety" (not "omnivore" — consistent with no-auto-tag decision)
- `getActiveDietTags(cruise)` to determine which tags to show counts for
- Collapsible toggle: local `useState<boolean>(false)`

---

## Critical files

| File | Action |
|---|---|
| `src/model/cruiseData.ts` | Add `updateRecipeCrewCount`, `updateRecipeMealSlot` |
| `src/model/cruiseDietCoverage.ts` | Reuse `getMealCoverage`, `getCruiseCoverage`, `getActiveDietTags` |
| `src/model/dietTags.ts` | Reuse `DIET_REGISTRY` for chip rendering |
| `src/components/CrewEditor.tsx` | **New** |
| `src/components/DraggableRecipeItem.tsx` | Add crewCount controls, remove mealSlot dropdown |
| `src/components/DroppableRecipieContainer.tsx` | 4 slot sections, per-slot SortableContext, coverage blocks, gray-out |
| `src/components/CruiseMenuTab.tsx` | Remove click-add, wire drag-to-slot, cross-slot drag, crewCount handler, coverage dots |
| `src/components/DroppableDayItem.tsx` | Status dot |
| `src/components/EditCruiseForm.tsx` | Swap number → CrewEditor |
| `src/components/AddCruiseForm.tsx` | Swap number → CrewEditor |
| `src/components/CruiseInfoTab.tsx` | Crew summary + collapsible |

---

## Verification

1. `npm run build` — zero TypeScript errors
2. Coverage blocks show "Brak załogi" when crew = 0
3. Add crew with mix of diets; drag vegan recipe from catalog → only matching slot sections accept drop, others grayed
4. Drop recipe into obiad slot → `mealSlot = DINNER`, `crewCount = crew.length`
5. Drag existing recipe from obiad section to kolacja section → mealSlot changes to SUPPER
6. Remove vegetarian recipe from slot with vegetarian crew → coverage block turns red
7. DroppableDayItem left-panel dot matches coverage state
8. Edit cruise → existing named/tagged members preserved in CrewEditor
9. CruiseInfoTab → per-tag counts correct, collapsible toggle works
10. Member with no tags shown as "brak diety" (not omnivore)
