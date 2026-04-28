---
name: add-recipe
description: Fetch a recipe from a URL, translate it to Polish, normalize ingredient amounts per person, check for similarity with existing recipes, and add new supplies and the recipe to src/data/supplies.json and src/data/recipies.json after user confirmation.
---

You are adding a new recipe to the CyberOchmistrz project. Follow these steps in order. Do not skip steps or batch confirmations early — each step gates the next.

## Step 0 — Get URL

If the user invoked this skill without a URL argument, ask for the recipe URL now before doing anything else.

## Step 1 — Fetch recipe

Use WebFetch to retrieve the URL. If fetch fails for any reason (blocked, JS-rendered, paywalled, 404), report the error clearly and stop. Do not attempt workarounds.

## Step 2 — Extract raw data

From the fetched content extract:
- Recipe name
- Description / intro text
- Serving count N (how many people the recipe is written for)
- Ingredient list: each with name, amount, and unit
- Step-by-step instructions
- Meal type hints (breakfast / lunch / dinner / dessert language)
- Source URL (already known)

## Step 3 — Confirm serving size

Show the user the **exact quote(s)** from the page that indicate serving count (e.g. "serves 4", "dla 6 osób"). Show your resolved N. Ask the user to confirm or correct N before proceeding. Do not continue until confirmed.

## Step 4 — Translate everything to Polish

Translate all of the following to Polish:
- Recipe name
- Description
- All ingredient names
- All instruction steps

Use the project's Polish domain glossary (from AGENTS.md) where applicable. For ingredient names, aim for natural Polish culinary terms.

## Step 5 — Normalize amounts per person

Divide every ingredient amount by confirmed N. Keep precision to 2 decimal places max; use clean fractions where natural (e.g. 0.25, 0.5).

## Step 6 — Map ingredients to supplies.json

Read `src/data/supplies.json`. For each translated ingredient:

- **Match found** (fuzzy name match): use the existing supply's `id`. Note the match.
- **No match**: propose a new supply entry with these fields inferred from context:
  - `id`: Polish kebab-case derived from the Polish name (lowercase, no diacritics replaced with ASCII equivalents, spaces → hyphens)
  - `name`: Polish name
  - `unit`: infer from ingredient type — use existing unit vocabulary: `gramy`, `mililitry`, `litry`, `sztuki`, `kilogramy`, `ząbki`, `torebka`, `saszetki`, `opakowanie`, `paczka`, `tabliczka`, `rolki`, `ml`
  - `category`: infer from existing categories: `alkohol`, `apteczka`, `inne`, `mięso`, `nabiał`, `napoje`, `owoce`, `pieczywo`, `przekąski`, `przyprawy`, `ryby`, `sery`, `tłuszcze`, `warzywa`, `zboża`, `środki czystości`. Only propose a new category as absolute last resort — ask the user explicitly if you reach that point.
  - `isVegetarian`: boolean, inferred
  - `isVegan`: boolean, inferred
  - `isIngredient`: true (it is being used in a recipe)

Present all proposed new supplies to the user. Allow them to edit any field before proceeding.

## Step 7 — Similarity check

Read `src/data/recipies.json`. For each existing recipe, compute ingredient overlap with the new recipe:

```
overlap = |new_ingredient_ids ∩ existing_ingredient_ids| / |new_ingredient_ids| * 100
```

If overlap ≥ 70% for any existing recipe, warn: "New recipe shares X% ingredients with '[existing recipe name]' — this may be a duplicate variant." List the shared ingredients. The user may choose to continue or abort.

## Step 8 — Build recipe object

Propose values for all fields. Show the user the full proposed recipe and allow them to edit any field.

**id**: Polish kebab-case from translated name. Show and allow edit.

**name**: Translated Polish name. Show and allow edit.

**description**: Translated.

**mealType**: Array of Polish meal type strings. Infer from recipe content using only these values: `śniadanie`, `obiad`, `kolacja`, `deser`. Show and allow edit.

**difficulty**: Integer 1–4. Infer from number of steps, techniques, and equipment required (1 = trivial, 4 = complex multi-step). Show and allow edit.

**ingredients**: Array of `{ "id": "<supply_id>", "amount": <per_person_amount> }`.

**instructions**: Array of translated Polish strings, one per step.

**developedBy**: Construct as follows:
1. Run `git config user.name` to get the committer name.
2. If the command fails or returns empty, prompt the user for their name.
3. Show the user the resolved name and ask for confirmation.
4. Format: `"[Name] na podstawie przepisu [full URL]"`

## Step 9 — Final confirmation

Show a complete human-readable summary:
- Full recipe object (formatted)
- List of new supplies to be added (if any)
- Any similarity warnings

Ask: "Dodać przepis i składniki do plików? (yes/no)"

Do not write any files until the user confirms.

## Step 10 — Write files

Only after explicit confirmation:

1. Append new supply entries to `src/data/supplies.json` (maintain JSON array structure, match existing formatting style).
2. Append new recipe entry to `src/data/recipies.json` (note: intentional "recipies" spelling — do not rename or correct the filename).

Report which entries were added and to which files.
