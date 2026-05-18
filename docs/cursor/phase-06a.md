# Phase 6A — Independent feature track (AI coach)

**Session load**: attach only this file unless merging with human direction.

**Prerequisite**: Audit lists this track; Phase 5 complete or human-approved parallel run.

## Goal

Ship a **self-contained** improvement to AI coaching: `AIChatModal`, `artifacts/api-server/src/routes/ai.ts`, prompts, and error/fallback behavior. No unrelated refactors.

## Scope guard

- Touch only files under a tight allow-list you state at session start (example: `AIChatModal.tsx`, `ai.ts`, prompt helpers).
- Contract changes require Phase 2 alignment in a separate session unless trivially backward compatible.

## Done checklist

- [ ] Allow-list respected; diff stays focused.
- [ ] Coach path tested (happy + missing API key fallback).
- [ ] Human sign-off; note any follow-ups for Phase 7.
