# Problem: items that are both supply and ingredient

## Current model

`supplies.json` has boolean `isIngredient`. Mutually exclusive:
- `isIngredient: false` → appears in CruiseSuppliesTab (additional supplies / shopping list)
- `isIngredient: true` → appears as recipe ingredient, hidden from supplies tab by default

`CruiseSuppliesTab` toggle: checkbox OFF = non-ingredients, checkbox ON = ingredients.
`getSuppliesByType(showIngredients)` → either `getNonIngredients()` or `getIngredients()`.

## Known dual-purpose case

`woda_butelkowana`:
- currently `isIngredient: false`, `unit: sztuki`
- used as recipe ingredient in `owsianka` (125) and `nalesniki-z-dzemem` (125)
- also needs to appear in supplies tab for drinking water logistics (per-person/per-day)
- unit should be volume (`litry` or `ml`), not `sztuki`

## Only current overlap (verified)

Only `woda_butelkowana` is a non-ingredient supply referenced by recipes.
But potential future candidates exist in non-ingredient categories:
- `napoje`: herbata, kawa, sok_owocowy, woda_butelkowana_gazowana — plausible recipe use
- `przekąski`: budyn, kisiel, zupki_w_proszku — plausible recipe use
- `przyprawy`: syrop_malinowy — plausible recipe use

## Options

### Option A — two independent boolean flags
Add `isAdditionalSupply: boolean` alongside `isIngredient: boolean`.

- `getNonIngredients()` → `getAdditionalSupplies()` (where `isAdditionalSupply: true`)
- `getIngredients()` unchanged (where `isIngredient: true`)
- Water gets both flags `true` → appears in both views
- All current non-ingredients need `isAdditionalSupply: true` added (43 entries)
- All current ingredients keep `isAdditionalSupply: false` (default/omitted)

**Pro:** clean semantics, independent axes, extensible to other dual-purpose items.
**Con:** 43-entry data migration, naming `isAdditionalSupply` may be confusing.

### Option B — enum/multi-value type
Replace `isIngredient: boolean` with `type: "ingredient" | "supply" | "both"`.

- Filter functions rewritten to check type
- Water gets `type: "both"`

**Pro:** single field, explicit.
**Con:** breaking change to all consumers, more complex filter logic.

### Option C — keep boolean, show ingredients in supplies tab too (checkbox becomes additive)
Change checkbox from "show ingredients instead" to "also show ingredients".

- `getSuppliesByType(showIngredients)` returns non-ingredients always + ingredients if checked
- Water flips to `isIngredient: true`, removed from non-ingredient list
- Appears in supplies tab only when checkbox ON

**Pro:** minimal data change (just fix water unit + flag).
**Con:** changes UX meaning of checkbox, ingredients flood supplies tab when checked.

## Open questions

1. Is `isAdditionalSupply` the right name, or better `isSupply` / `showInSuppliesTab`?
2. Should future `napoje`/`przekąski`/`przyprawy` items be dual-purpose proactively, or case-by-case?
3. Unit for water: `litry` (consistent with other liquid ingredients) or `ml`?
