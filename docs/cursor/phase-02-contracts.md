# Phase 2 — Contracts and generated code

**Prerequisite**: Phase 1 checklist complete.

## Goal

Keep `lib/api-spec/openapi.yaml` the source of truth and ensure generated clients (`lib/api-client-react`, `lib/api-zod`) match it. Align types used by `artifacts/api-server` and `artifacts/fitai` with the contract.

## Tasks

1. Diff mental model: OpenAPI routes ↔ Express routers ↔ mobile `custom-fetch` / hooks usage.
2. If the spec changed: run the appropriate generator scripts from `lib/api-spec/package.json` (inspect scripts; do not guess command names).
3. Fix type errors caused by contract drift with minimal surface change.

## Constraints

- Prefer regenerating over hand-editing `src/generated/**`.
- No behavioral feature work unless required to satisfy the contract.

## Done checklist

- [ ] OpenAPI, server routes, and client usage agree for touched surfaces.
- [ ] `pnpm run typecheck` passes for implicated packages.
- [ ] Human sign-off to enter Phase 3.
