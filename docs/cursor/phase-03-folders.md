# Phase 3 — Folder structure and module boundaries (high risk)

**Prerequisite**: Phase 2 checklist complete.

## Goal

Improve folder layout and import boundaries **without** mixing unrelated concerns. This phase intentionally has the most moving parts.

## Execution model — seven domain-scoped commits

Plan **seven separate commits** (each mergeable on its own), for example:

1. **Mobile `app/` routing group** — route files only; no logic rewrite.
2. **Mobile components** — `artifacts/fitai/components` moves / renames with import updates.
3. **Mobile contexts and hooks** — `contexts`, `hooks` boundaries.
4. **Mobile constants / lib** — `constants`, `lib` organization.
5. **API server structure** — `artifacts/api-server/src` routers, middlewares, lib.
6. **Workspace `lib/*` packages** — public exports and `package.json` `exports` fields if used.
7. **Cleanup** — dead imports, barrel files (only if already introduced in commits 1–6).

Adjust domain names to fit the audit; keep the **seven-commit discipline**.

## Rules

- After each commit: `pnpm run typecheck` (or the narrowest package check if full run is too slow — document which).
- No dependency adds without `DEPENDENCY REQUEST` approval.
- Do not combine “move everything” into one commit.

## Done checklist

- [ ] Seven domain commits landed (or documented reason to merge fewer, with human approval).
- [ ] Import graph has no obvious cycles introduced.
- [ ] `pnpm run typecheck` green after final commit.
- [ ] Human sign-off to enter Phase 4.
