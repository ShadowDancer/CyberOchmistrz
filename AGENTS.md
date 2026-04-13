## Lazy context loading

Read CONTRIBUTING.md to learn about code structure and data flow.

Do not load all files into context initially, use CONTRIBUTING.md to figure out parts to read and load the rest lazily - if already loaded part of code references it or you have moderate suspicion that changes you make might influence unloaded parts of the code.

---

## Language in repository

Use English as the natural language in the repository with exception:

- README file - it is in Polish
- some domain terms are deliberately in Polish

---

## Documentation for agents - keep updated

In case you add a functionality or make a change to existing one, check if description CONTRIBUTING.md is still valid and adjust it accordingly. For example:

- when a known bug is fixed, remove it from the file
- when dataflow is changed, reflect it in the graph
- when directory structure changes (e.g file is added, removed), reflect it in the documentation file

---

## Task → Files to Load

Load only what is listed. Load more only if loaded files reference them or side-effects are suspected.

| Task                      | Files                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------- |
| Shopping list bug/feature | `src/model/cruiseData.ts`, `src/types/index.ts`                                         |
| Recipe display/editing    | `src/model/recipieData.ts`, `src/components/Recipe*`                                    |
| Drag-and-drop             | `src/components/Draggable*`, `src/components/Droppable*`, `src/app/rejsy/[id]/page.tsx` |
| Supply add/change         | `src/data/supplies.json`, `src/model/supplyData.ts`, `src/types/index.ts`               |
| Cruise CRUD               | `src/model/cruiseData.ts`, `src/app/rejsy/`                                             |
| Styling only              | The specific page/component file                                                        |

---

## Codebase Invariants

- `recipie` (vs `recipe`) is intentional — used in all filenames, types, variables. Do NOT fix.
- localStorage key: `cyber-ochmistrz-cruises`
- SSR guard pattern: `typeof window === 'undefined'` before any localStorage access
- Static JSON (`recipies.json`, `supplies.json`) is read-only at runtime — new items generate downloadable JSON for manual merge
- `basePath` is empty in dev, `/CyberOchmistrz` in prod (patched by CD pipeline)
- No state library — read CONTRIBUTING.md § State Management before adding one

---

## Tests

Test files live in `test/`, mirror `src/model/` naming (e.g. `cruiseData.test.ts`).
Run: `npm test`. Add tests for any model layer change.

---

## Polish Domain Glossary

Polish appears in string literals and route paths, not in variable/function names (which are English + intentional `recipie` spelling).

| Term | Meaning | Where used |
|------|---------|------------|
| przepis / przepisy | recipe / recipes | routes, JSON, UI strings |
| rejs / rejsy | cruise / cruises | routes, UI strings |
| skladnik / skladniki | ingredient / supplies | routes, UI strings |
| ochmistrz | steward (ship officer) | app name only |
| posilek | meal type | enum values |
| dzien / dni | day / days | cruise day labels |
| zaloga | crew | cruise form fields |
| lista zakupow | shopping list | UI strings |
| danie | dish | recipe type labels |

---

## New Code Patterns

New components:
- `'use client'` directive (unless pure presentational with no hooks)
- `export default function` declarations (not arrow, not `React.FC`)
- `interface ComponentNameProps { ... }` above component, destructured in params
- Tailwind + project utility classes, no CSS modules
- Types from `@/types`

New pages:
- `'use client'` + `useState` + `useEffect` hydration pattern
- SSR guard before any localStorage access

---

## Skip Unless Directly Referenced

- `src/app/layout.tsx` — static nav bar
- `.github/workflows/` — CI/CD only
- `public/` — PWA/assets only
- `next.config.ts` — build config only
- `src/utils/polishDeclension.ts` — Polish unit text only
