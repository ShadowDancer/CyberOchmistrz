# Plan: RecipeIngredientEditor Fixes

## Context

Editor currently saves every change immediately to localStorage via parent callbacks. User wants explicit Save/Cancel control. Separately, the modal is too narrow on desktop (unit text truncated) and the ingredient dropdown clips at the bottom of the scroll container.

Decisions resolved in grilling:
- "Zamknij" → replaced by "Anuluj" + "Zapisz" buttons
- Cancel with unsaved changes → custom inline confirmation dialog (Polish)
- Backdrop click → same as Cancel (with confirmation if dirty)
- Desktop width: `max-w-xl` (576px), mobile unchanged
- Dropdown: always render above the input (fixes clipping without portal complexity)
- Recipe name editable inline in header (cruise-day copy only, catalog unaffected)

---

## Changes

### 1. `src/model/cruiseData.ts`

Add new export function after `removeIngredientFromRecipeInCruise` (≈line 355):

```ts
export function saveCruiseDayRecipeEdits(
  cruiseId: string,
  dayNumber: number,
  recipeIndex: number,
  name: string,
  ingredients: Array<{ id: string; amount: number }>
): void {
  const cruise = getCruiseById(cruiseId);
  if (!cruise) return;
  const dayIndex = cruise.days.findIndex(d => d.dayNumber === dayNumber);
  if (dayIndex === -1) return;
  const recipe = cruise.days[dayIndex].recipes[recipeIndex];
  if (!recipe?.recipeData) return;
  recipe.recipeData.name = name;
  recipe.recipeData.ingredients = ingredients;
  saveCruise(cruise);
}
```

### 2. `src/components/RecipeIngredientEditor.tsx`

Full rewrite. Key changes:
- Add `onSave(dayNumber, recipeIndex, name, ingredients)` prop; remove `onIngredientUpdate/Add/Remove`
- Hold `draftIngredients` and `draftName` in local state (initialized from `recipe.ingredients` / `recipe.name`)
- Hold `showCancelConfirm` boolean state
- Header: `<h2>Edytuj składniki - <input value={draftName} .../></h2>` — inline editable input styled to match heading
- Pass draft-mutating callbacks to `IngredientListEditor` (no parent calls until Save)
- "Zapisz" button → calls `onSave(dayNumber, recipeIndex, draftName, draftIngredients)` then `onClose()`
- "Anuluj" button → if dirty (JSON compare draft vs original + name compare) → set `showCancelConfirm = true`, else `onClose()`
- Backdrop div click → same logic as Anuluj
- `showCancelConfirm` renders inline confirmation banner:
  - Text: "Masz niezapisane zmiany. Czy chcesz je odrzucić?"
  - Button "Odrzuć zmiany" (red/danger style) → `onClose()`
  - Button "Wróć do edycji" → `setShowCancelConfirm(false)`
- Width: `max-w-md` → `md:max-w-xl` (mobile unchanged)

Props interface becomes:
```ts
interface RecipeIngredientEditorProps {
  recipe: Recipie;
  dayNumber: number;
  recipeIndex: number;
  onSave: (dayNumber: number, recipeIndex: number, name: string, ingredients: Array<{ id: string; amount: number }>) => void;
  onClose: () => void;
}
```

### 3. `src/components/IngredientListEditor.tsx`

Change dropdown from opening below to opening **above** the input:

```tsx
// Before
<div className="dropdown-container">

// After — override position to above
<div className="dropdown-container bottom-full top-auto mb-1 mt-0">
```

(`dropdown-container` uses `absolute` + `mt-1`; adding `bottom-full top-auto mb-1 mt-0` flips it upward)

### 4. `src/components/CruiseMenuTab.tsx`

- Import `saveCruiseDayRecipeEdits` from `../model/cruiseData`
- Remove `handleIngredientUpdate`, `handleIngredientAdd`, `handleIngredientRemove`, `refreshEditingRecipeFromCruise`
- Add:
```ts
const handleSaveRecipeEdits = (
  dayNumber: number,
  recipeIndex: number,
  name: string,
  ingredients: Array<{ id: string; amount: number }>
) => {
  saveCruiseDayRecipeEdits(cruise.id, dayNumber, recipeIndex, name, ingredients);
  onCruiseChange();
};
```
- Update `<RecipeIngredientEditor>` usage: replace three callbacks with `onSave={handleSaveRecipeEdits}`

---

## Verification

1. Open recipe ingredient editor → make a change → click × or backdrop → confirmation dialog appears
2. Click "Odrzuć zmiany" → modal closes, original ingredients and name unchanged
3. Open again → make change → click "Zapisz" → modal closes, change persisted
4. Edit recipe name inline → save → cruise day shows new name; open recipe catalog — original name unchanged
5. On desktop: modal is wider, unit text ("sztuki", "gramy") visible without truncation
6. Type in "Dodaj składnik..." → dropdown opens above the input, not clipped by modal bottom
7. On mobile: width unchanged (modal still full-width)
