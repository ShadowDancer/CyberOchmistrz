## Test conventions

- Shared harness: `cruiseTestHarness.ts` — localStorage mock + cruise seed helpers. Import for any cruise-related test
- No global Jest setup file; each test file is self-contained
- `describe` nesting: top-level = feature/module, inner = function name
- `it('should ...')` — always starts with "should"
- `jest-theories` available for parameterized tests: `theories('label | {name}', cases, (theory) => { ... })`
- Imports: `from '../src/model/...'` and `from '../src/types'`
- Run: `npm test`

## Assertion style

Keep assertions succinct — minimize boilerplate, maximize signal.

### Local helper functions

Define small helpers at top of `describe` block to hide repetitive structure:

- **Builder helpers** — shorthand for test data setup. Accept only fields that vary, default the rest.
  Example: `makeCruise({ length, crew, days })`, `setupTestCruise({ supplies?, crew? })`
- **Matcher helpers** — return `expect.objectContaining(...)` so assertions read like specs.
  Example: `supply('woda', 10, false, false)`, `item('jajka', 12, 'sztuki', [source])`
- **Finder helpers** — wrap repeated `.find()` predicates with a named function.
  Example: `findSupply(supplies, id, perPerson, perDay)`
- **Accessor helpers** — shorthand for reaching into stored state.
  Example: `getSupplies()` instead of `getStoredCruises()[0].additionalSupplies!`

### Prefer `expect.objectContaining` / `expect.arrayContaining`

- Assert structure, not exact equality, unless the test specifically verifies exhaustive shape
- Nest `expect.objectContaining` inside `expect.arrayContaining` for collections
- When only one field matters (e.g. `amount`), assert that field directly: `expect(find(...)?.amount).toBe(5)`

### Avoid

- Repeating long `.find(s => s.id === ... && s.flag === ...)` inline — extract to helper
- Full object literals in `toEqual` when only 1-2 fields are under test
- Multi-line setup that could be a one-liner builder call
