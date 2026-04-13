## Test conventions

- Shared harness: `cruiseTestHarness.ts` — localStorage mock + cruise seed helpers. Import for any cruise-related test
- No global Jest setup file; each test file is self-contained
- `describe` nesting: top-level = feature/module, inner = function name
- `it('should ...')` — always starts with "should"
- `jest-theories` available for parameterized tests: `theories('label | {name}', cases, (theory) => { ... })`
- Imports: `from '../src/model/...'` and `from '../src/types'`
- Run: `npm test`
