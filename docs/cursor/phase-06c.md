# Phase 6C — Independent feature track (workouts / XP)

**Session load**: attach only this file unless merging with human direction.

**Prerequisite**: Audit lists this track; Phase 5 complete or human-approved parallel run.

## Goal

Self-contained workout loop changes: `constants/workouts.ts`, achievements, XP math, `WorkoutPlayerModal`, `WorkoutSwipeCard`, completion rewards. Keep game economy rules understandable and documented in-code where non-obvious.

## Scope guard

- Do not change unrelated navigation or API routes.
- If math changes affect stored progress, document impact in PR.

## Done checklist

- [ ] XP / streak / achievement rules summarized in PR for reviewers.
- [ ] `pnpm run typecheck` for fitai passes.
- [ ] Human sign-off; note follow-ups for Phase 7.
