# Phase 7 — Verify, CI, and ship

**Prerequisite**: Intended feature phases complete; audit risks either resolved or explicitly deferred.

## Goal

Prove the workspace is shippable: typecheck, any package tests, lint if configured, and sanity scripts. Prepare a concise release or PR summary.

## Tasks

1. Run `pnpm run typecheck` at root; fix failures introduced earlier in the phase chain.
2. Run package-level `test` / `lint` where present (`pnpm -r --if-present`).
3. Update `docs/cursor/audit/latest.md` with a short **Closure** section: what shipped, what was deferred, known issues.

## Done checklist

- [ ] Root typecheck green.
- [ ] Optional checks documented if skipped (reason + owner).
- [ ] Audit closure section written.
- [ ] Human approves merge / release.
