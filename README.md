# Contributing to CyberOchmistrz

## Prerequisites

Local machine needs:

- **Node.js** (v20+ recommended, matches CI `actions/setup-node@v4` default)
- **npm** (ships with Node)

No global TypeScript install needed — `tsc` runs via `ts-jest` and `next` from `node_modules`.

## Quick Start

```bash
npm install          # Install dependencies
npm run dev          # Dev server with Turbopack hot reload (localhost:3000)
npm run build        # Production build (static export to out/)
npm start            # Serve production build
npm run lint         # ESLint
npm test             # Jest test suite
```

---

## What the Code Does

**CyberOchmistrz** ("Cyber Steward") is a tool for a ship's second officer (ochmistrz) to prepare provisions for sailing cruises. Core features:

1. **Cookbook** (`/przepisy`) — Browse, add, edit recipes with ingredients, difficulty ratings, meal types
2. **Cruises** (`/rejsy`) — Create cruises (name, days, crew as tagged member list), assign recipes to each day via drag-and-drop with per-recipe portion count and meal slot, add extra supplies
3. **Shopping list generation** — Aggregate all ingredients from assigned recipes (scaled by each recipe's `crewCount`) + additional supplies into a categorized shopping list with CSV export
4. **Diet coverage check** — Per (day, mealSlot) max-flow analysis reports whether each meal feeds every crew member given their dietary tags (omnivore / vegetarian / vegan); extensible tag registry
5. **Supplies catalog** (`/skladniki`) — Browse and add ingredients/supplies used in recipes

Static data (recipes, supplies) ships in JSON. Cruises persisted in `localStorage`. Deployed as static site to GitHub Pages with PWA support.

---

## Directory Structure

```
CyberOchmistrz/
├── .cursorignore              # Excludes build artifacts from Cursor indexing
├── .github/workflows/         # CI (test+build on PR) and CD (deploy to gh-pages on master push)
├── .vscode/                   # Debug launch configs for Next.js
├── public/                    # PWA manifest, static SVGs
├── src/
│   ├── app/                   # Next.js App Router (routes, layouts, pages)
│   │   ├── layout.tsx         # Root layout: nav bar with links to 3 sections
│   │   ├── page.tsx           # Landing page with hero + links
│   │   ├── przepisy/          # /przepisy — recipe list, add, edit
│   │   ├── rejsy/             # /rejsy — cruise list/detail, add, edit
│   │   └── skladniki/         # /skladniki — supplies catalog, add
│   ├── components/            # All React components (see below)
│   │   └── AGENTS.md          # Component conventions for AI agents
│   ├── data/                  # Static JSON catalogs
│   │   ├── recipies.json      # ~20 recipes with ingredients, instructions
│   │   └── supplies.json      # ~100 supplies with units, categories, veg flags
│   ├── model/                 # Domain logic (no UI)
│   │   ├── AGENTS.md          # Model layer rules for AI agents
│   │   ├── cruiseData.ts      # Cruise CRUD, recipe assignment, shopping aggregation, CSV export
│   │   ├── cruiseDietCoverage.ts  # Max-flow diet coverage (Dinic's algorithm), smart crewCount defaults
│   │   ├── dietTags.ts        # Extensible diet tag registry (omnivore, vegetarian, vegan)
│   │   ├── recipieData.ts     # Recipe loading, ingredient resolution, veg checks
│   │   └── supplyData.ts      # Supply loading, filtering, validation
│   ├── types/                 # TypeScript interfaces and enums
│   │   └── index.ts           # Supply, Ingredient, Recipie, Cruise, shopping list types
│   └── utils/
│       └── polishDeclension.ts  # Polish grammatical number for units
├── test/                      # Jest test suite (~18 test files)
│   └── AGENTS.md              # Test conventions for AI agents
├── package.json
├── next.config.ts             # Static export + PWA config
├── jest.config.js
└── tsconfig.json
```

---

## Libraries

### Runtime dependencies

- **Next.js 15.3** — React framework, App Router, static export (`output: 'export'`)
- **React 19** — UI rendering
- **@dnd-kit/core + @dnd-kit/sortable** — Drag-and-drop for assigning/reordering recipes on cruise days
- **next-pwa** — Service worker generation for offline PWA support

### Dev dependencies

- **TypeScript 5** — Type safety
- **Tailwind CSS 4** (via `@tailwindcss/postcss`) — Utility-first styling
- **Jest 30 + ts-jest** — Unit testing
- **jest-theories** — Parameterized test cases
- **ESLint 9 + eslint-config-next** — Linting

---

## State Management

No state library (Redux, Zustand, etc.). Pattern:

- **Static data:** direct `import` of JSON files
- **Mutable data:** `localStorage` with SSR guard (`typeof window === 'undefined'` returns empty)
- **Component state:** React `useState` + `useEffect` for hydration
- Each page that needs cruise data calls `getCruises()` / `getCruiseById()` which reads `localStorage` synchronously
- Mutations call `saveCruise()` which writes back to `localStorage`, then component re-reads

---

## Known Issues and Tech Debt

1. **localStorage only** — No sync between devices, no backend
2. **No online recipe/supply editing** — New items generate JSON for manual file merge
3. **No day add/remove** — Cruise day count fixed at creation (edit can change length but warns about recipe loss)
4. **Typo in codebase** — "recipie" used consistently instead of "recipe" (in filenames, types, variables) — intentional per `.DotSettings` dictionary
5. **Callback type mismatch** — `CruiseSuppliesTab` declares `onSupplyChange(cruise)` but parent passes zero-arg refresh function
6. **DnD ID parsing fragility** — `activeId.split('-')` assumes recipe IDs don't contain hyphens

---

## Polish Domain Glossary (additions)

| Term                    | Meaning                     | Where used                      |
| ----------------------- | --------------------------- | --------------------------------|
| dieta wegetariańska     | vegetarian diet             | UI tags, coverage report        |
| dieta wegańska          | vegan diet                  | UI tags, coverage report        |
| wszystkożerna           | omnivore (diet tag)         | diet tag registry               |
| załogant / załoganci    | crew member / crew members  | cruise model, form fields       |

---

Live at: https://shadowdancer.github.io/CyberOchmistrz/

Static export means no server-side features — everything runs client-side.
