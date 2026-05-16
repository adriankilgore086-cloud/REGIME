# Phase 4 — Component surgery (UI)

**Prerequisite**: Phase 3 checklist complete.

## Goal

Refine or rebuild UI components in `artifacts/fitai/components` (and closely related styles) with consistent design language. This is the “component surgery” session — **only** UI composition and local state tied to presentation.

## Scope

- In: layout, props, accessibility labels, loading/empty states, visual polish, splitting oversized components.
- Out: navigation structure changes (unless audit flagged a blocking bug), global data architecture (Phase 5), API contract changes (Phase 2).

## Tasks

1. Pick a **small set** of components from the audit (or user directive); list them at the top of your session summary.
2. Match existing patterns: colors from `constants/colors.ts`, existing typography and spacing.
3. Add or preserve error boundaries where components can throw during data load.

## Done checklist

- [ ] Listed components updated with no unrelated file churn.
- [ ] App still starts (`pnpm` filter for fitai as documented in root `package.json`).
- [ ] Human visual review (screenshots or device) for touched UI.
- [ ] Human sign-off to enter Phase 5.
