# Phase 6B — Independent feature track (social)

**Session load**: attach only this file unless merging with human direction.

**Prerequisite**: Audit lists this track; Phase 5 complete or human-approved parallel run.

## Goal

Self-contained social feature work: `SocialContext`, post composer, reactions/comments flows, and related UI surfaces. No API contract redesign unless explicitly in scope.

## Scope guard

- State changes must preserve existing AsyncStorage namespaces or include a one-shot migration strategy documented in the PR body.
- Avoid touching unrelated tabs or workout player unless required for compile.

## Done checklist

- [ ] Data migration strategy documented if keys changed.
- [ ] Smoke test: create post, comment/reaction path as applicable.
- [ ] Human sign-off; note follow-ups for Phase 7.
