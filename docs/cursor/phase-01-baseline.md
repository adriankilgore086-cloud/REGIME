# Phase 1 — Baseline and guardrails

**Prerequisite**: `@docs/cursor/audit/latest.md` from Phase 0 is accepted.

## Goal

Align the repo for safe mechanical work: `.gitignore`, obvious broken scripts, README accuracy at a minimal level, and any **tiny** fixes that unblock typecheck without product redesign.

## Constraints

- No new dependencies unless you follow `.cursorrules` `DEPENDENCY REQUEST` and get approval.
- No large moves; **folder moves belong in Phase 3**.

## Tasks

1. Confirm root scripts in `package.json` match reality (`typecheck`, filters for `artifacts/**`).
2. Fix only clear breakages (wrong paths, stale script names) in docs or config.
3. Note in `docs/cursor/audit/latest.md` addendum (short section) if you discover audit drift worth recording.

## Done checklist

- [ ] `pnpm run typecheck` passes at repo root (or documented blocker with exact error and owner phase).
- [ ] No secrets or env files committed.
- [ ] Human sign-off to enter Phase 2.
