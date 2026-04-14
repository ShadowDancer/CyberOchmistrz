## Lazy context loading

Read README.md to learn about code structure and data flow.

Do not load all files into context initially, use README.md to figure out parts to read and load the rest lazily - if already loaded part of code references it or you have moderate suspicion that changes you make might influence unloaded parts of the code.

---

## Language in repository

Use English as the natural language in the repository with exception:

- some domain terms are deliberately in Polish

---

## Documentation for agents - keep updated

In case you add a functionality or make a change to existing one, check if description README.md is still valid and adjust it accordingly. For example:

- when a known bug is fixed, remove it from the file
- when dataflow is changed, reflect it in the graph
- when directory structure changes (e.g file is added, removed), reflect it in the documentation file

When you add or remove file, make sure to update directory structure in README.md

## Polish Domain Glossary

Polish appears in string literals and route paths, not in variable/function names (which are English + intentional `recipie` spelling).

| Term                 | Meaning                | Where used               |
| -------------------- | ---------------------- | ------------------------ |
| przepis / przepisy   | recipe / recipes       | routes, JSON, UI strings |
| rejs / rejsy         | cruise / cruises       | routes, UI strings       |
| skladnik / skladniki | ingredient / supplies  | routes, UI strings       |
| ochmistrz            | steward (ship officer) | app name only            |
| posilek              | meal type              | enum values              |
| dzien / dni          | day / days             | cruise day labels        |
| zaloga               | crew                   | cruise form fields       |
| lista zakupow        | shopping list          | UI strings               |
| danie                | dish                   | recipe type labels       |
