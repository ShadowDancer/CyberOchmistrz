Use English as the natural language in the repository with exception:

- README file - it is in Polish
- some domain terms are deliberately in Polish

Read CONTRIBUTING.md to learn about code structure and data flow.

Do not load all files into context initially, use CONTRIBUTING.md to figure out parts to read and load the rest lazily - if already loaded part of code references it or you have moderate suspicion that changes you make might influence unloaded parts of the code.

In case you add a functionality or make a change to existing one, check if description CONTRIBUTING.md is still valid and adjust it accordingly. For example:

- when a known bug is fixed, remove it from the file
- when dataflow is changed, reflect it in the graph
- when directory structure changes (e.g file is added, removed), reflect it in the documentation file
