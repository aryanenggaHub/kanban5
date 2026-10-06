# IT PMO Kanban Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `index.html`, a single-file vanilla-JS Kanban board for a fictitious bank's IT PMO.

**Architecture:** One `state = { tasks: [], filters: {project,assignee,priority} }` object is the source of truth; `renderBoard()` rebuilds columns/cards (and the summary) from it; mutations go through `addTask/moveTask/deleteTask`; events are delegated on the board container.

**Tech Stack:** HTML, CSS, JS (no frameworks, no build, no external resources).

**Spec:** `docs/superpowers/specs/2026-10-06-it-pmo-kanban-design.md` (visual language: `DESIGN.md`)

## Global Constraints

- One file `index.html`; opens by double-click; no CDN/fonts/images; system font stack; inline SVG/Unicode icons.
- No storage APIs of any kind (localStorage/sessionStorage/IndexedDB/cookies). UI note: "Demo data — resets on refresh".
- No `!important`; CSS custom properties for palette + spacing; Action Blue `#0066cc` is the only interactive colour; flat cards (1px hairline `#e0e0e0`, no shadow); red/amber only for priority/Overdue.
- ID format `ITPM-####` (zero-padded incrementing); subject `[IT PMO] New task <id>: <title>`; wordmark text "IT PMO"; no real bank branding.
- Semantic HTML, `label for` on every input, visible focus rings, `aria-label` on icon-only buttons, toast region `aria-live="polite"`, priority pills carry text.
- All user strings go through `escapeHtml()`; no DOM mutation of card contents outside `renderBoard()`.
- Only network call: `fetch(FORMSUBMIT_ENDPOINT)` JSON POST, in try/catch; config constant at top of script with activation comment.

## Review Focus

- Title/assignee that is only whitespace → must fail required validation.
- HTML in title/assignee/description (`<img onerror>`) → rendered as text, never executed.
- Due date today → valid; yesterday → invalid; task due today is not Overdue.
- Filter that matches nothing → columns show empty state and counts 0; summary stays global.
- Moving to the same column, or deleting while another card is in confirm state → no error; only one confirm open at a time.
- Network failure/non-2xx → warning toast, card stays, submit button re-enabled.

---

### Task 1: Shell, styling, state, seed data, rendering

**Files:**
- Create: `index.html`

**Interfaces:**
- Produces: `const STATUSES = ["Backlog","In Progress","Blocked","Done"]`; `state`; `escapeHtml(s: string): string`; `isOverdue(task): boolean`; `renderBoard(): void` (also calls `renderSummary()`); `renderCard(task): string`; `renderSummary(): void`; `getVisibleTasks(): Task[]`. `Task = {id,title,description,project,category,assignee,priority,dueDate:"YYYY-MM-DD",status}`.

- [ ] **Step 1:** Write the page skeleton: global bar (wordmark + "+ Add Task" button), summary strip with reset note, filter bar (project select, assignee input, priority select, each with `<label for>`), `<main>` board with four `<section>` columns (name + count badge), toast region, modal container (empty for now). Responsive grid, stacked below 768px.
- [ ] **Step 2:** Implement CSS tokens (palette/spacing from DESIGN.md), card styling with priority left-border classes, priority pill, category tag, Overdue badge, focus rings.
- [ ] **Step 3:** Implement `escapeHtml`, `isOverdue` (due < today string-compare and status ≠ Done), seed 8 tasks (dates relative to today, ≥1 overdue, all 4 columns, mixed priorities/projects; include the three example titles from the spec), `renderCard`, `renderBoard`, `renderSummary` (total, per status, overdue — global, not filtered).
- [ ] **Step 4:** Verify: open in browser; 8 cards in right columns, counts correct, overdue badge visible, zero console errors. Temporarily set a seed title to `<img src=x onerror=alert(1)>` and confirm it displays as text, then revert.

### Task 2: Move and delete (drag/drop, keyboard, inline confirm)

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: Task 1 `state`, `renderBoard`, `STATUSES`.
- Produces: `moveTask(id: string, status: string): void`; `deleteTask(id: string): void`; `state.confirmingId: string|null`.

- [ ] **Step 1:** Add `moveTask` (no-op if same/unknown status; updates state; re-renders) and `deleteTask`.
- [ ] **Step 2:** Cards `draggable="true"`; delegated `dragstart` (store id in dataTransfer), `dragover` (preventDefault + add `drop-target` class to column), `dragleave`/`drop` (remove class, call `moveTask`).
- [ ] **Step 3:** Each card renders a "Move ▸" `<select>` (labelled, options = other statuses) and a `×` button with `aria-label`; × sets `state.confirmingId` and re-renders the card as "Delete? Yes / No"; Yes calls `deleteTask`, No clears. Only one confirm at a time.
- [ ] **Step 4:** Verify in browser: drag card across all columns (highlight shows, counts/summary update); Move ▸ via keyboard only; delete Yes/No; open confirm on card A then × on card B leaves only B in confirm.

### Task 3: Filters

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `state.filters`, `getVisibleTasks`.
- Produces: `applyFilters(): void` (reads the three controls into `state.filters`, re-renders).

- [ ] **Step 1:** Implement project/priority exact match and assignee case-insensitive contains in `getVisibleTasks`; wire `input`/`change` events to `applyFilters`; empty columns show a "No tasks" empty state; count badges reflect the filtered view.
- [ ] **Step 2:** Verify: each filter alone and combined; assignee "tan" matches "Tan Wei"; no-match shows zeros and empty states; summary strip unchanged.

### Task 4: Add Task modal, validation, FormSubmit, toasts

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `renderBoard`, `STATUSES`, `state.tasks`.
- Produces: `FORMSUBMIT_ENDPOINT` (const, top of script, activation comment above); `validateForm(values): {field:string→message}`; `addTask(values): Task` (assigns next `ITPM-####`); `notifyNewTask(task): Promise<object>` (payload exactly as in the brief with the `[IT PMO]` subject); `showToast(message: string, kind: "success"|"warning"): void`.

- [ ] **Step 1:** Build the modal form with all eight fields per spec (maxlength 80/500, selects with specified options, priority default Medium, status default Backlog), `<label for>`, an error `<p>` under each field, Esc/cancel close, focus moved into modal on open and back to the button on close.
- [ ] **Step 2:** Implement `validateForm` (trimmed required title/assignee, length caps, due date required and ≥ today) and render inline errors with `aria-invalid`; no `alert()`.
- [ ] **Step 3:** Implement `addTask`, `showToast` (aria-live region, auto-dismiss ~4s), `notifyNewTask`. Submit handler: validate → `addTask` → render → reset/close → success toast → disable button "Sending…" → `await notifyNewTask` in try/catch → on failure warning toast "Card added locally — email notification failed" → re-enable button.
- [ ] **Step 4:** Verify in browser: invalid submits show per-field errors (incl. whitespace-only, past date); valid submit adds `ITPM-0009`, card appears immediately, form reset; with the placeholder endpoint the warning toast appears and the board still works; button returns from "Sending…"; HTML in title is shown as text; second add yields `ITPM-0010`.

### Task 5: Final verification

**Files:**
- Modify: `index.html` (fixes only)

- [ ] **Step 1:** Grep the file for forbidden items: `localStorage|sessionStorage|indexedDB|document.cookie|!important|http` (only the FormSubmit URL allowed), `<script src`, `<link`.
- [ ] **Step 2:** Resize to <768px (stacked columns), tab through the whole UI with keyboard only (focus ring visible everywhere), confirm console is clean.
- [ ] **Step 3:** Report results honestly, then give the user: the config constant to change, the FormSubmit activation step, and one paragraph on making the board persistent.
