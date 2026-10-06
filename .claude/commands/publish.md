---
description: Publish the project to GitHub (push, README, Pages, CI/CD, About section, security scan)
argument-hint: <github-repo-url>
allowed-tools: Bash, PowerShell, Read, Write, Edit, Glob, Grep
---

Publish this project to the GitHub repo: **$ARGUMENTS**

If `$ARGUMENTS` is empty or not a `https://github.com/<owner>/<repo>` (or `.git` / `git@github.com:`) URL, stop and ask the user for the repo link. Derive `OWNER` and `REPO` from it. The Pages URL will be `https://OWNER.github.io/REPO/`.

Follow the steps in order. Do the security scan FIRST, because nothing may be pushed until it passes.

## 0. Preflight

- Run `gh auth status`. If `gh` is missing or not logged in, stop and tell the user to run `gh auth login` (never ask for tokens).
- Run `git rev-parse --is-inside-work-tree`. If not a repo, `git init -b main`.
- Confirm the repo exists: `gh repo view OWNER/REPO`. If it doesn't, ask the user before creating it (`gh repo create`), and ask whether it should be public (GitHub Pages on free plans needs public).

## 1. Security scan (blocking)

Scan every file that would be committed (`git ls-files` plus untracked non-ignored files; also `docs/` and `.claude/`):

- Secrets: API keys, tokens, passwords, private keys (`-----BEGIN`, `ghp_`, `github_pat_`, `AKIA`, `sk-`, `xox[bp]-`, `AIza`), `.env*`, `*.pem`, `*.key`, credentials files.
- Personal data: real email addresses, phone numbers, internal hostnames/IPs, absolute local paths (`C:\Users\...`). In `index.html`, `FORMSUBMIT_ENDPOINT` must contain only a placeholder email, never the user's real address. The user's own email must not appear anywhere in tracked files.
- Project rules from CLAUDE.md: no storage APIs, no real bank branding, no `!important`.
- Local-only files: `.claude/settings.local.json`, scratchpad output, editor folders.

Use Grep for the patterns above. Create or extend `.gitignore` (`.env*`, `*.pem`, `*.key`, `.claude/settings.local.json`, `.vscode/`, `node_modules/`, OS junk) before staging. Also check `git log -p` if history already exists.

Report findings as a short table (file:line, issue, fix). If anything is found, fix it (or ask the user), then rescan. **Do not continue until the scan is clean.** End this step by stating "Security scan: clean" with the list of patterns checked.

## 2. README

Create or update `README.md` (edit in place if present; preserve user-written content). Include: title and one-line description, live demo link (Pages URL), CI/CD badge for the workflow, feature list, the screenshot (see below), how to run (open `index.html`, no build), constraints (single file, no storage so refresh resets to seed data, no real branding), project structure, and licence line if a LICENSE exists. Derive facts from `index.html` and `CLAUDE.md`; don't invent features.

**Screenshot:** use the Playwright MCP tools (load via ToolSearch if deferred) to capture the board. Playwright blocks `file:` URLs, so serve the page first (a ten-line `node:http` static server kept in the scratchpad, run in the background, then stopped; Python may not be installed) and use `http://localhost:8000/index.html`; use the live Pages URL only for a refresh after the first deploy. `browser_resize` to 1440x900, `browser_navigate`, then `browser_take_screenshot` with `fullPage: true`, `type: png`, `filename: docs/screenshot.png`. View the image to confirm it shows the populated board, then embed it under the badge line as `![IT PMO Kanban board](docs/screenshot.png)` (replace any existing image line rather than duplicating). Add `.playwright-mcp/` to `.gitignore` and stage `docs/screenshot.png` by name in step 4. If Playwright is unavailable, say so in the final report and leave the README without an image.

## 3. CI/CD workflow

Create `.github/workflows/ci-cd.yml` (update if present):

- Triggers: `push` and `pull_request` on `main`, plus `workflow_dispatch`.
- Job `check`: checkout, then shell checks with no package manager needed: `index.html` exists, no `localStorage|sessionStorage|indexedDB|document.cookie`, no `!important`, no external `http(s)://` script/link/img sources, and a secret-pattern grep (same patterns as step 1). Fail the job on any hit.
- Job `deploy` (needs `check`, only on `push` to `main`): `actions/configure-pages`, `actions/upload-pages-artifact` (copy `index.html` into a `_site/` folder), `actions/deploy-pages`. Permissions: `contents: read`, `pages: write`, `id-token: write`. Concurrency group `pages`, `cancel-in-progress: false`. Environment `github-pages` with the page URL.
- Pin actions to current major versions.

## 4. Commit and push

- `git remote` → add `origin` as the repo URL, or `set-url` if it differs.
- Stage explicitly by name (not blind `git add -A` unless the scan covered everything), review `git status` and `git diff --cached --stat`.
- Commit with a clear message, ending with the co-author attribution line from the session reminder.
- `git push -u origin main`. If the remote has unrelated history, stop and ask before any merge or force push. Never force push without explicit permission.

## 5. GitHub Pages

Enable Pages with Actions as the source:

```
gh api -X POST repos/OWNER/REPO/pages -f build_type=workflow
```

If it already exists (HTTP 409), update instead: `gh api -X PUT repos/OWNER/REPO/pages -f build_type=workflow`. Then watch the workflow with `gh run watch` (or `gh run list`), and confirm the site responds: `gh api repos/OWNER/REPO/pages --jq .html_url`. If the deploy fails, read `gh run view --log-failed`, fix, and push again.

## 6. About section

Set description, homepage (the Pages URL) and topics:

```
gh repo edit OWNER/REPO --description "<one line, no real bank names>" --homepage "https://OWNER.github.io/REPO/" --add-topic kanban --add-topic vanilla-js --add-topic github-pages
```

Verify with `gh repo view OWNER/REPO --json description,homepageUrl,repositoryTopics`.

## 7. Final report

Reply briefly with: repo URL, Pages URL, workflow run status, security scan result, and anything skipped or needing user action (e.g. FormSubmit activation, Pages not yet live). State failures plainly.
