Pure domain logic — no React, no UI imports. Must be testable in isolation.

## File-specific rules

- `cruiseData.ts`: SSR guard (`typeof window === 'undefined'`) required for all localStorage access. Key: `cyber-ochmistrz-cruises`
- `supplyData.ts` and `recipieData.ts`: read-only static JSON, no localStorage
- Both `supplyData` and `recipieData` export `getIngredients`/`getIngredientById` — name collision if both imported via `*`; use explicit imports

## Conventions

- Validation functions return Polish error strings
- Sort with `localeCompare(..., 'pl')` for Polish alphabetical order
- No browser APIs except guarded localStorage in `cruiseData.ts`
