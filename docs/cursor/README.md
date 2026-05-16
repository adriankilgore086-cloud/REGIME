# Cursor phased workflow for Regime

## How to load instructions

1. **Every session**: Cursor reads `.cursorrules` at the repo root automatically — dependency policy and sacred rules always apply.
2. **One phase per session**: Attach **only** the phase you are executing, for example:

   `@docs/cursor/phase-04-components.md`

   Do not mix multiple phase files in one session unless you are explicitly doing a handoff summary.

## Recommended flow

| Order | File | Notes |
|------:|------|--------|
| 0 | `phase-00-audit.md` | Chat mode (e.g. Opus). Produces the audit doc other phases reference. |
| 1 | `phase-01-baseline.md` | Repo hygiene, scripts, minimal fixes. |
| 2 | `phase-02-contracts.md` | API spec, generated clients, types. |
| 3 | `phase-03-folders.md` | Highest coordination cost — plan **seven domain-scoped commits** inside this phase. |
| 4 | `phase-04-components.md` | UI component surgery in `artifacts/fitai`. |
| 5 | `phase-05-state-and-api.md` | Contexts, persistence, API wiring. |
| 6A–6D | `phase-06a.md` … `phase-06d.md` | Independent feature tracks; separate sessions allowed. |
| 7 | `phase-07-verify.md` | Final verification, CI, and ship checklist. |

## Artifacts

Phases may ask you to write or update markdown under `docs/` (for example an audit). Keep those artifacts in git so later `@` references stay stable.
