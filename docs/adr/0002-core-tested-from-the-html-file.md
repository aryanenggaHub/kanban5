# Version 2's board core is tested straight out of index.html

The brief bans npm, build steps and extra files, so the core lives in `<script id="core">` and `v2/board.test.mjs` extracts that block and runs it with `node:test`, which ships with Node. Moving the core into its own `.js` file would be simpler but breaks the single-file rule. If the core outgrows one script block, revisit.
