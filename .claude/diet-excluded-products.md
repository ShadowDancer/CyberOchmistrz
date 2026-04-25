# Plan: Diet — Excluded Products per Crew Member

## Goal
Let crew members specify ingredients they can't eat.
Exclusions are orthogonal to diet type.
Coverage check treats recipes containing excluded ingredients as incompatible, same as diet mismatch.

Prerequisite: Plan `diet-tag-migration.md` completed.

---

## Resolved decisions

| Decision | Resolution |
|---|---|
| Architecture | `excludedSupplies: string[]` on `CrewMember`, not tag-based |
| Intolerances (gluten/lactose) | Out of scope |
| `canEat` extension | Add exclusion check on top of existing diet check |
| Coverage field | `forbiddenIngredientCounts: Record<string, number>` on `MealCoverage` |

---

## 1. `src/model/crew.ts`

Add `excludedSupplies` to `CrewMember`:

```typescript
export interface CrewMember {
  id: string;
  name: string;
  diet: Diet;
  excludedSupplies?: string[];
}
```

---

## 2. `src/model/cruiseDietCoverage.ts`

Extend `canEat` with exclusion check:

```typescript
export function canEat(member: CrewMember, recipe: Recipie): boolean {
  return DIET_REGISTRY[member.diet].satisfies(recipe) &&
    !recipe.recipeData.ingredients.some(ing =>
      member.excludedSupplies?.includes(ing.id)
    );
}
```

**`MealCoverage` type** — add field:
```typescript
forbiddenIngredientCounts: Record<string, number>; // ingredient ID → count of unfed members with that exclusion in slot
```

**New helper** `getForbiddenIngredientCounts(unfed, slotRecipes)` — for each unfed member, count which of their `excludedSupplies` appear in any `slotRecipes` ingredient list. Aggregate per ingredient ID.

**`defaultMealCoverage`** — initialize `forbiddenIngredientCounts: {}`.

Extend unit tests: member with `excludedSupplies` blocked by matching ingredient, not blocked by non-matching ingredient.

---

## 3. `src/components/CrewEditor.tsx`

Add per-member expand section below each row:
- Checkbox "Ma wykluczenia składników"
- When checked: text filter + scrollable ingredient list (`getIngredients()`) + excluded tags with `×`

---

## 4. `src/components/DroppableRecipieContainer.tsx`

After existing `missingTagsLine`, add excluded ingredient warnings.
For each entry in `forbiddenIngredientCounts`, look up ingredient name via `getSupplyById`, render:
> `Ilość członków załogi, którzy nie mogą jeść 'jajka': 1`

---

## 5. `src/utils/markdownExport.ts`

After `formatMissingTagLine(...)`, add similar block for `forbiddenIngredientCounts`.
Use `getSupplyById` (already imported) to resolve ingredient name. Format per ingredient:
> `Ilość członków załogi, którzy nie mogą jeść 'jajka': 1`

---

## 6. `src/components/DroppableDayItem.tsx`

Check if it renders coverage details directly — if so, same `forbiddenIngredientCounts` display as `DroppableRecipieContainer`.

---

## 7. `src/components/CruiseInfoTab.tsx`

Update `describeMember` to include exclusions when present:
```
"Dieta wszystkożerna"
"Dieta wegetariańska, wykluczenia: jajka, mleko"
```

---

## Not changed
- Shopping list — excluded ingredients still aggregate normally
- Markdown export crew section — no crew exclusion listing there
