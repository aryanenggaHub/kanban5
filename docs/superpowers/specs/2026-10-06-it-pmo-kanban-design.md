# IT PMO Kanban — Design Spec

## Intent
Internal demo/training tool: a single-page Kanban board for a fictitious bank's IT PMO. One file, `index.html`, opened by double-click. No real bank branding; neutral "IT PMO" text wordmark. Visual language from `DESIGN.md` (Apple-style: Action Blue #0066cc as the only interactive accent, flat cards with hairline border, no shadows, pill CTAs, SF/system font stack).

## Hard constraints
- Vanilla HTML/CSS/JS, one file, no frameworks, no build, no server, no external resources (no CDN/fonts/images; inline SVG or Unicode icons).
- No persistence of any kind (no localStorage/sessionStorage/IndexedDB/cookies). Refresh resets to 8 seeded tasks; UI shows a small note saying so.
- Only network call: FormSubmit AJAX JSON endpoint. User's email address is sent nowhere else.
- No `!important`; CSS custom properties for palette and spacing; semantic HTML; `label for` on every input; visible focus rings; `aria-label` on icon-only buttons; `aria-live="polite"` toast region; colour never the sole signal.

## Decisions (agreed)
- Task ID format `ITPM-####` (zero-padded incrementing counter, starts after seed IDs); email subject `[IT PMO] New task <id>: <title>`. (Neutral prefix instead of `UOB-ITPM` to honour the no-trademark rule.)
- Red/amber are used only as semantic status colours (priority border/pill, Overdue badge). All interactive elements use Action Blue.
- FormSubmit from `file://` may or may not be accepted; failure shows the non-blocking warning toast and never affects the board.

## Layout
- Global bar (black, 44px): "IT PMO" wordmark, "+ Add Task" pill button.
- Summary strip (parchment): total, per-status counts, overdue count, note "Demo data — resets on refresh".
- Filter bar: Project select (with "All"), Assignee text (contains, case-insensitive), Priority select (with "All").
- Board: 4 columns Backlog / In Progress / Blocked / Done, CSS grid, side by side on desktop, single column <768px. Column header: name + live count badge (counts reflect the filtered view).
- Add Task: modal (`<dialog>`-free simple overlay with focus management, Esc to close).

## Card
ID, title, project, assignee, priority pill (text), due date, category tag; left border colour by priority (Critical red, High amber, Medium blue, Low grey); "Overdue" badge if due < today and status ≠ Done; "Move ▸" control (a `<select>` of target columns); × delete button with inline "Delete? Yes / No" confirm (no `confirm()`). `draggable="true"`.

## State and code structure
`state = { tasks: [], filters: { project:"", assignee:"", priority:"" } }` is the single source of truth (plus transient UI flags: `confirmingId`). Functions: `renderBoard()`, `renderCard()`, `renderSummary()`, `addTask()`, `moveTask()`, `deleteTask()`, `applyFilters()`, `showToast()`, `notifyNewTask()`, `escapeHtml()`, `validateForm()`. All card content is produced by `renderBoard()`; events are delegated on the board container. Every user string passes through `escapeHtml()`.

## Behaviour
- Drag/drop: native HTML5 DnD; hovered column gets a highlight class; drop calls `moveTask(id, status)`.
- Keyboard: Move ▸ select calls `moveTask`.
- Add form: fields per brief (title ≤80 required, description ≤500, project, category, assignee required, priority default Medium, due date required and not in the past, status default Backlog). Inline errors under invalid fields; no `alert()`.
- Submit: validate → `addTask()` (optimistic, card appears, form resets, modal closes, success toast) → `notifyNewTask()` in try/catch in parallel; button disabled with "Sending…" while in flight; on failure warning toast "Card added locally — email notification failed".
- `FORMSUBMIT_ENDPOINT` config constant at top of script with an HTML comment explaining one-time activation (first submission triggers a confirmation email; delivery only after the link is clicked).

## Seed data
8 realistic tasks spread across the four columns (e.g. FX pricing service to AWS, CVE patch on branch teller VDI, UAT sign-off for mobile onboarding release 4.2), including at least one overdue and a mix of priorities/projects. Dates are generated relative to today so the demo always has an overdue item.

## Testing
No framework (no npm/build allowed). Manual browser verification: add (valid/invalid), drag, Move ▸, delete confirm, filters, summary counts, overdue badge, <768px layout, failed-network toast, no console errors.
