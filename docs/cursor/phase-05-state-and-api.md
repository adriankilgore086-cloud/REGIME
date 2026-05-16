# Phase 5 — State, persistence, and API wiring

**Prerequisite**: Phase 4 checklist complete (or explicit human waiver for parallel work).

## Goal

Work in `artifacts/fitai/contexts`, data loading, AsyncStorage keys, React Query usage (if present), and how the app calls `artifacts/api-server` through generated or custom clients.

## Scope

- In: `FitnessContext`, `SocialContext`, persistence namespaces, Clerk-related wiring consistency, fetch error handling.
- Out: purely visual tweaks (Phase 4), OpenAPI shape changes (Phase 2), directory moves (Phase 3).

## Tasks

1. Map user ID namespacing and storage keys; document in session notes if you add keys.
2. Align server calls with the contract; remove dead endpoints or stub calls only with audit backing.
3. Add targeted logging where it prevents silent failure (no PII).

## Done checklist

- [ ] Contexts and API usage consistent with `REGIME_CODEMAP.md` or audit addendum.
- [ ] No new secrets; env usage documented in code comments only when necessary.
- [ ] `pnpm run typecheck` green for touched packages.
- [ ] Human sign-off to enter Phase 6 tracks or Phase 7.
