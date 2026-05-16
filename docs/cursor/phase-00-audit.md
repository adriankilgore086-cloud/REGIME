# Phase 0 — Repository audit (Chat mode)

**Session load**: attach only this file (plus code you need to inspect).

## Goal

Produce a single **audit document** (suggested path: `docs/cursor/audit/latest.md`) that every later phase references. The audit is the contract for what exists today, what is fragile, and what must not change without explicit follow-up.

## Mode

Use **Chat** (planning / analysis), not a blind Agent sweep across the whole tree. Read selectively; cite paths.

## Audit sections (required)

1. **Executive summary** — product, primary surfaces (`artifacts/fitai`, `artifacts/api-server`, `lib/*`).
2. **Architecture map** — how mobile, API, spec, and generated clients connect (align with `REGIME_CODEMAP.md`; note drift if any).
3. **Dependency hotspots** — notable Expo, React Native, Express, and workspace packages; call out `patches/` entries.
4. **Risk register** — top 10 risks (ordering, data loss, auth, env, native modules, bundle size, etc.).
5. **Testing and quality gates** — what commands exist today; what is missing.
6. **Phase routing** — which follow-up phases should own which items (by phase id).

## Outputs

- Create or overwrite `docs/cursor/audit/latest.md` with the sections above.
- If you create `docs/cursor/audit/` for the first time, a one-line pointer in `docs/cursor/README.md` is optional; prefer not to expand scope.

## Done checklist

- [ ] `docs/cursor/audit/latest.md` exists and is internally consistent (no contradictions with obvious code facts).
- [ ] Risk register has clear owners (phase ids) for each item.
- [ ] Human reviewed the audit and agrees it is the baseline for Phase 1+.
