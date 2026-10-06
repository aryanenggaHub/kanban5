# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file (`index.html`) IT PMO Kanban demo for a fictitious bank. Vanilla HTML/CSS/JS only. Specs and plans live in `docs/superpowers/` (spec: `specs/2026-10-06-it-pmo-kanban-design.md`); visual language comes from `DESIGN.md`.

## Running and testing

- No build, lint, or package manager. Run it by opening `index.html` in a browser (no server).
- No test framework (npm/build are banned). Verification used a throwaway copy of `index.html` with an injected `<script>` that drove the page and wrote PASS/FAIL lines into a `<pre id="results">`, run via `chrome --headless=new --allow-file-access-from-files --virtual-time-budget=5000 --dump-dom <file>`. Keep such harnesses outside the project (e.g. scratchpad).
- Test visibility with `getComputedStyle(...).display`, not the `.hidden` property: an earlier bug (`.overlay { display:flex }` beating `[hidden]`) passed property-based checks.

## Hard constraints (from the brief)

- One file, no frameworks, no CDN/fonts/images, no `!important`.
- No storage APIs of any kind (localStorage, sessionStorage, IndexedDB, cookies). Refresh must reset to the seed data, and the UI says so.
- No real bank branding; wordmark is "IT PMO". Task IDs are `ITPM-####` and the email subject is `[IT PMO] ...` (deliberately not `UOB-`).
- Only network call is `notifyNewTask()` to `FORMSUBMIT_ENDPOINT` (placeholder email; needs one-time FormSubmit activation). It must stay in try/catch and never break the board.

## Architecture

All logic is in the `<script>` block, organised around one `state` object (`tasks`, `filters`, plus transient UI flags `confirmingId` and `focus`).

- **Render-from-state:** `renderBoard()` rebuilds the entire board innerHTML from `getVisibleTasks()` and calls `renderSummary()` (summary counts are global, not filtered; column badges are filtered). Never mutate card DOM elsewhere; change `state`, then call `renderBoard()`.
- **Mutations:** `addTask`, `moveTask`, `deleteTask`, `applyFilters`. `nextNum` is a module-level counter for IDs.
- **Event delegation:** `init()` attaches listeners once on `#board` (click for delete/confirm, change for the Move ▸ select, native HTML5 drag events), since the board DOM is replaced on every render.
- **Focus restore:** because render replaces the DOM, `state.focus` holds a selector that `renderBoard()` focuses afterwards (keeps keyboard users in place after Move/Delete).
- **Escaping:** every user-supplied string must pass through `escapeHtml()` before going into a template string.
- **Add Task flow:** `onSubmit` → `validateForm` → `addTask` (optimistic render) → close modal + success toast → `notifyNewTask` in try/catch, with a warning toast on failure.
- **Dates:** `YYYY-MM-DD` strings compared lexically (`todayStr()`, `addDays()`); seed due dates are relative to today so the demo always has an overdue item.

## Styling

CSS tokens are in `:root` and mirror `DESIGN.md` (Action Blue `#0066cc` is the only interactive colour; flat cards with hairline borders, no shadows). Red/amber are reserved for priority and Overdue only.
