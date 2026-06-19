# Special Blocks for Meal Slots

## Context

Meal slots sometimes need to be marked as "handled outside normal provisioning" — e.g. eating at a restaurant, boarding day, leftovers. These slots should be locked (no recipes), excluded from diet coverage checks, and annotated with a required free-form comment. Feature must exist at both the domain (types + model) and UI level.

## Design decisions (from grilling)

- Block **locks** the slot: no recipes can be added while block is active
- Block has a **required free-form comment** (no predefined types)
- Block is added/removed via **context menu on slot header** (⋮ button)
- Blocked slot is **excluded from coverage checks** entirely; coverage treats it as "satisfied"
- `isFullyCovered` only considers non-blocked, non-snack slots
- No backward compatibility needed — clean break
- `CruiseDay.recipes` is a **map** `Partial<Record<MealType, MealSlotItem>>` — makes invalid state (block + recipes on same slot) irrepresentable at type level
- `MealSlotItem = SpecialBlock | RecipeSlot` — named union for future extensibility
- `SpecialBlock` carries `type: 'special-block'` discriminator; no `mealSlot` field (map key carries it)
- `RecipeSlot` carries `type: 'recipe-slot'` discriminator and wraps `CruiseDayRecipe[]`; enables explicit `.type` checks everywhere, no `Array.isArray` needed
- `CruiseDayRecipe` keeps `type: 'recipe'` discriminator; `mealSlot` field **removed** (map key carries it)
- Coverage function receives the full map and explicitly handles `SpecialBlock` entries as satisfied
- All callsites previously reading `recipe.mealSlot` must get slot from their map-key context

---

## Files to modify

### 1. `src/types/index.ts`

```typescript
export interface SpecialBlock {
  type: 'special-block';
  comment: string; // required, non-empty
}

export interface RecipeSlot {
  type: 'recipe-slot';
  recipes: CruiseDayRecipe[];
}

export interface CruiseDayRecipe {
  type: 'recipe';
  originalRecipeId: string;
  recipeData: Recipie;
  crewCount: number;
  // mealSlot removed — map key in CruiseDay.recipes carries this
}

export type MealSlotItem = SpecialBlock | RecipeSlot;

export interface CruiseDay {
  dayNumber: number;
  recipes: Partial<Record<MealType, MealSlotItem>>;
}
```

### 2. `src/model/cruiseData.ts`

**`createNewCruise`**: init each day with `recipes: {}` (empty object, not `[]`).

**`addRecipeToCruiseDay`**: push into `recipes[mealSlot]` array (initialize if absent; guard: if slot holds `SpecialBlock`, no-op):

```typescript
export function addRecipeToCruiseDay(
  cruiseId: string,
  dayNumber: number,
  recipeId: string,
  recipeData: Recipie,
  crewCount: number,
  mealSlot: MealType
): void
```

Internal: `const slot = day.recipes[mealSlot]; if (slot?.type === 'special-block') return; /* blocked */ const existing = slot?.recipes ?? []; day.recipes[mealSlot] = { type: 'recipe-slot', recipes: [...existing, { type: 'recipe', ... }] };`

**`setRecipeCrewCount`**: add `mealSlot: MealType` param; index into `recipes[mealSlot][recipeIndex]`:

```typescript
export function setRecipeCrewCount(
  cruiseId: string,
  dayNumber: number,
  mealSlot: MealType,
  recipeIndex: number,
  crewCount: number
): void
```

**`setRecipeMealSlot`**: moves recipe between slot arrays — remove from `recipes[sourceMealSlot]` at index, push to `recipes[targetMealSlot]`:

```typescript
export function setRecipeMealSlot(
  cruiseId: string,
  dayNumber: number,
  sourceMealSlot: MealType,
  recipeIndex: number,
  targetMealSlot: MealType
): void
```

Guard: if `recipes[targetMealSlot]?.type === 'special-block'`, no-op.

**`removeRecipeFromCruiseDay`**: add `mealSlot: MealType` param; splice from `recipes[mealSlot]`:

```typescript
export function removeRecipeFromCruiseDay(
  cruiseId: string,
  dayNumber: number,
  mealSlot: MealType,
  recipeId: string,
  recipeIndex: number
): void
```

**New — `setSpecialBlock`**: sets `recipes[mealSlot] = { type: 'special-block', comment }`, replacing any existing recipes for that slot:

```typescript
export function setSpecialBlock(
  cruiseId: string,
  dayNumber: number,
  mealSlot: MealType,
  comment: string
): void
```

**New — `removeSpecialBlock`**: deletes `recipes[mealSlot]`:

```typescript
export function removeSpecialBlock(
  cruiseId: string,
  dayNumber: number,
  mealSlot: MealType
): void
```

### 3. `src/model/cruiseDietCoverage.ts`

Update `getDayCoverage` signature — receives full map:

```typescript
export function getDayCoverage(
  dayNumber: number,
  recipes: Partial<Record<MealType, MealSlotItem>>,
  members: CrewMember[],
): DayCoverageReport
```

Internal logic:

```typescript
const NON_SNACK_MEALS = [MealType.BREAKFAST, MealType.DINNER, MealType.SUPPER];
const meals: MealCoverage[] = [];
const satisfiedSlots = new Set<MealType>();

for (const [slot, item] of Object.entries(recipes) as [MealType, MealSlotItem][]) {
  if (slot === MealType.SNACK) continue;
  if (item.type === 'special-block') {
    satisfiedSlots.add(slot);
    continue;
  }
  meals.push(getMealCoverage(item.recipes, members, slot));
}

const presentMealTypes = new Set(meals.map(m => m.mealType));
const allNonSnackPresent = NON_SNACK_MEALS.every(
  t => satisfiedSlots.has(t) || presentMealTypes.has(t)
);
```

`getCruiseCoverage`: pass `day.recipes` directly (type already matches).

### 4. `src/utils/markdownExport.ts`

`getDayCoverage` call: no change to call site (type now matches).

Replace `day.recipes.filter(r => r.mealSlot === mealType)` with map lookup:

```typescript
for (const mealType of MEAL_SLOT_ORDER) {
  const item = day.recipes[mealType];
  let slotContent = `## ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`;

  if (!item) {
    slotContent += '\nBrak przepisów';
  } else if (item.type === 'special-block') {
    slotContent += `\n_${item.comment}_`;
  } else {
    // item.type === 'recipe-slot' — existing recipe rendering logic on item.recipes
    ...
  }
  blocks.push(slotContent);
}
```

### 5. `src/components/DroppableRecipieContainer.tsx`

Props update — replace `recipes: CruiseDayRecipe[]` with `recipes: Partial<Record<MealType, MealSlotItem>>`:

```typescript
interface DroppableRecipieContainerProps {
  recipes: Partial<Record<MealType, MealSlotItem>>;
  onSetBlock: (dayNumber: number, mealSlot: MealType, comment: string) => void;
  onRemoveBlock: (dayNumber: number, mealSlot: MealType) => void;
  // existing props unchanged
}
```

Replace `.filter(({ recipe }) => recipe.mealSlot === slot)` with direct `recipes[slot]` lookup.

Pass `item={recipes[slot]}`, `onSetBlock`, `onRemoveBlock` into each `SlotSection`.

**`SlotSection` changes:**

```typescript
interface SlotSectionProps {
  item?: MealSlotItem;
  onSetBlock: (dayNumber: number, mealSlot: MealType, comment: string) => void;
  onRemoveBlock: (dayNumber: number, mealSlot: MealType) => void;
  // existing props unchanged
}
```

Slot header: add `⋮` button that toggles a small dropdown:
- No block: shows "Dodaj blokadę" → triggers inline comment input
- Block active: shows "Usuń blokadę" → calls `onRemoveBlock`

When `item.type === 'special-block'`:
- Replace drop zone with block card: `[🚫 comment text]` + gray bg, italic text
- Hide `CoverageDisplay`
- `useDroppable` still registers the node but drops are no-op (checked in `CruiseMenuTab`)

When adding a block, show inline form (not a modal):
- Text input (required, min 1 char)
- Confirm button (disabled if empty) + Cancel button

### 6. `src/components/DroppableDayItem.tsx`

Replace `recipes.filter((r) => r.mealSlot === slot)` with `recipes[slot]` lookup. Adjust typing accordingly.

### 7. `src/components/DraggableRecipeItem.tsx`

`recipe.mealSlot` removed from `CruiseDayRecipe`. Parent must pass `mealSlot` explicitly into drag data. Update drag data construction to receive slot from context/prop.

### 8. `src/components/CruiseMenuTab.tsx`

Add handlers:

```typescript
const handleSetBlock = (dayNumber: number, mealSlot: MealType, comment: string) => {
  setSpecialBlock(cruise.id, dayNumber, mealSlot, comment);
  onCruiseChange();
};

const handleRemoveBlock = (dayNumber: number, mealSlot: MealType) => {
  removeSpecialBlock(cruise.id, dayNumber, mealSlot);
  onCruiseChange();
};
```

In `handleDragEnd`: before calling `addRecipeToCruiseDay`, check if target slot holds `SpecialBlock`:

```typescript
const dayIdx = cruise.days.findIndex(d => d.dayNumber === dayNumber);
const targetItem = cruise.days[dayIdx]?.recipes[targetMealSlot];
if (targetItem?.type === 'special-block') return; // blocked
```

Update `setRecipeCrewCount` and `removeRecipeFromCruiseDay` calls to include `mealSlot` param.

Pass `recipes={day.recipes}`, `onSetBlock={handleSetBlock}`, `onRemoveBlock={handleRemoveBlock}` to `DroppableRecipieContainer`.

---

## Verification

1. **Unit tests** — `src/model/cruiseDietCoverage.ts`:
   - Blocked slot excluded from `meals` array in `DayCoverageReport`
   - `isFullyCovered` true when all non-blocked non-snack slots covered
   - Day with all 3 main slots blocked → `isFullyCovered` true
   - Blocked slot counted as satisfied even with zero recipes

2. **Unit tests** — `src/model/cruiseData.ts`:
   - `setSpecialBlock` replaces existing recipes for that slot
   - `removeSpecialBlock` clears slot entirely
   - `addRecipeToCruiseDay` no-ops when slot holds `SpecialBlock`
   - `setRecipeMealSlot` no-ops when target slot holds `SpecialBlock`
   - Block does not affect other slots' recipe arrays

3. **Manual UI flow**:
   - Open meal planning tab → click ⋮ on a slot → "Dodaj blokadę"
   - Empty comment → confirm disabled
   - Enter comment → confirm → slot shows block card, drop zone gone
   - Coverage display absent for blocked slot; other slots still checked
   - Day status dot reflects only non-blocked slots
   - Click ⋮ on blocked slot → "Usuń blokadę" → slot returns to normal
   - Drag recipe onto blocked slot → no-op
   - Markdown export shows block comment in italic for blocked slot
