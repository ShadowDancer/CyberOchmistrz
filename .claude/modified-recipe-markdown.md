# Plan: Markdown Export — Group Recipes by `originalRecipeId`

## Context

Recipes sharing `originalRecipeId` in same meal slot are currently exported as separate blocks with duplicated instructions. Goal: show instructions once (from catalog), list ingredients separately per version.

## Decisions

| # | Decision |
|---|----------|
| S2 | Only group when 2+ versions share `originalRecipeId` in same slot; single-version keeps original format |
| H3 | `###` header = unique `recipeData.name` values joined by ` / ` (deduped) |
| A1 | Each version labeled `Składniki (VersionName, N osób):` |
| O3 | Versions sorted descending by `crewCount` within group |
| I→catalog | Instructions from `getRecipeById(originalRecipeId)`; fall back to first version if catalog miss |
| N1 | Note always shown when grouped: `"Zmodyfikowana wersja przepisu wymaga od kuka okrętowego inwencji twórczej podczas gottowania!"` |
| F2 | Catalog miss → use first version instructions + still show note |
| G1 | Group order = first occurrence of `originalRecipeId` in `day.recipes` |
| Slots | Same `originalRecipeId` in different slots = separate groups |

## Output format (grouped)

```
### Zupa pomidorowa / Zupa pomidorowa z mięsem.

Składniki (Zupa pomidorowa z mięsem, 5 osób):
- 500 gramów pomidorów

Składniki (Zupa pomidorowa, 3 osoby):
- 300 gramów pomidorów

Zmodyfikowana wersja przepisu wymaga od kuka okrętowego inwencji twórczej podczas gottowania!

Sposób przygotowania:
1. ...
```

---

## Changes

### 1. `src/utils/polishDeclension.ts`

Add to `unitDeclensions`:
```ts
'osoba': { singular: 'osoba', paucal: 'osoby', plural: 'osób' },
```

### 2. `src/utils/markdownExport.ts`

- Import `getRecipeById` from `'../model/recipieData'`
- Replace the `for (const recipe of slotRecipes)` loop with grouping logic:
  1. Build ordered group list: iterate `slotRecipes`, collect unique `originalRecipeId` in first-occurrence order
  2. For each group:
     - If 1 recipe → render original format (unchanged)
     - If 2+ recipes:
       - Sort group descending by `crewCount`
       - Header: unique names deduped, joined ` / `
       - For each version: `Składniki (name, N osób/osoby/osoba):` + ingredient lines (amount × crewCount)
       - Note line
       - Fetch instructions via `getRecipeById(originalRecipeId)`; fall back to `group[0].recipeData.instructions`
       - `Sposób przygotowania:` + numbered steps

### 3. `test/markdownExport.test.ts`

Add mock for `'../src/data/recipies.json'` (needed for `getRecipeById` lookups). Add tests:
- Two versions same slot same `originalRecipeId` → grouped output, instructions once, note present
- Same `originalRecipeId` in different slots → two separate groups
- Three versions → sorted descending by `crewCount`, header deduped if names match
- Catalog miss → falls back to first version instructions, note still shown
- Single version → original format unchanged
