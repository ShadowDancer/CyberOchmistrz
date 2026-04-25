# Plan: Diet — DietTag Migration

## Goal
Replace `tags: string[]` on `CrewMember` and `dietTags.ts` with typed `Diet` enum + `DIET_REGISTRY` in `crew.ts`.
Introduce `canEat(member, recipe)` (diet-only, no exclusions yet).

---

## Resolved decisions

| Decision | Resolution |
|---|---|
| `CrewMember` model | Migrate from `types/index.ts` (`tags: string[]`) → `crew.ts` (`diet: Diet`) |
| `dietTags.ts` | Delete; `satisfies` logic moves into `canEat` switch in `cruiseDietCoverage.ts` |
| Compatibility function | `export function canEat(member: CrewMember, recipe: Recipie): boolean` in `cruiseDietCoverage.ts`, diet-only; extended in Plan B |

---

## 1. `src/model/crew.ts`

Add `Diet`, `DIET_REGISTRY`, new `CrewMember` (no `excludedSupplies` yet):

```typescript
export interface CrewMember {
  id: string;
  name: string;
  diet: Diet;
}

export type Diet = "omnivore" | "vegetarian" | "vegan";

interface DietMetadata {
  labelShort: string;
  labelLong: string;
}

export const DIET_REGISTRY: Record<Diet, DietMetadata> = {
  omnivore:    { labelShort: "wszystkoż.", labelLong: "wszystkożerna" },
  vegetarian:  { labelShort: "weget.",     labelLong: "wegetariańska" },
  vegan:       { labelShort: "weg.",       labelLong: "wegańska" },
};
```

No `recipieData` import in `crew.ts`. Diet domain stays pure — labels only.

---

## 2. `src/types/index.ts`

Remove `CrewMember` definition. Update all import sites to import from `../model/crew`.

---

## 3. `src/model/dietTags.ts`

Delete. All consumers migrated to `crew.ts`.

---

## 4. `src/model/cruiseDietCoverage.ts`

Replace existing compatibility lambda with exported `canEat` (diet-only).
Recipe predicate imports live here — `cruiseDietCoverage.ts` is the crew+recipe intersection, correct place for this coupling:

```typescript
import { isRecipieVegan, isRecipieVegetarian } from "./recipieData";

export function canEat(member: CrewMember, recipe: Recipie): boolean {
  switch (member.diet) {
    case "omnivore":   return true;
    case "vegetarian": return isRecipieVegetarian(recipe);
    case "vegan":      return isRecipieVegan(recipe);
  }
}
```

TypeScript exhaustiveness check catches missing cases when new `Diet` values are added.

Use in `getMealCoverage`:
```typescript
const allocationChecker = new CrewRecipeAllocationChecker(
  members, slotRecipes,
  (member, recipe) => canEat(member, recipe)
);
```

Add unit tests for `canEat`: omnivore eats anything, vegetarian blocked by meat, vegan blocked by dairy.

---

## 5. `src/components/CrewEditor.tsx`

Replace tag-toggle diet buttons with single-select `<select>` bound to `member.diet`.
Use `DIET_REGISTRY` keys for options, `labelLong` for display.

---

## 6. `src/components/CruiseInfoTab.tsx`

- Fix layout: crew list spans full column width
- Update `describeMember` to use `member.diet` + `DIET_REGISTRY`:
  ```
  "Dieta wszystkożerna"
  "Dieta wegetariańska"
  ```
- Update diet summary counts (`vegCount`, `veganCount`) to use `member.diet` directly

---

## 7. Remaining migration sites

Update `member.tags` → `member.diet` in:
- `AddCruiseForm.tsx`
- `EditCruiseForm.tsx`
- `maxFlow.ts`
- `DroppableDayItem.tsx`
- `DroppableRecipieContainer.tsx`

---

## Not changed
- `excludedSupplies` — added in Plan B
- Shopping list
- Markdown export
