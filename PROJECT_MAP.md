# PROJECT_MAP

Authoritative map of the REGIME repo for developers and AI context. For historical snapshots and prompts, see [docs/archive/](docs/archive/).

## Workspace

- **Tooling:** pnpm workspaces ([pnpm-workspace.yaml](pnpm-workspace.yaml), root [package.json](package.json)).
- **TypeScript:** Root `tsconfig.base.json` / `tsconfig.json`; packages extend as needed.

| Path | Role |
|------|------|
| [artifacts/fitai](artifacts/fitai) | REGIME — Expo SDK 54 app (expo-router), product name REGIME, npm package `@workspace/fitai` |
| [artifacts/api-server](artifacts/api-server) | Express 5 API (bundled with esbuild) |
| [artifacts/mockup-sandbox](artifacts/mockup-sandbox) | Vite + React UI sandbox (non-shipping design/playground) |
| [lib/api-spec](lib/api-spec) | OpenAPI source |
| [lib/api-zod](lib/api-zod) | Generated Zod schemas |
| [lib/api-client-react](lib/api-client-react) | Generated hooks/client used by the mobile app |
| [lib/db](lib/db) | Drizzle + PostgreSQL schema tooling |
| [scripts](scripts) | Shared workspace scripts |

## Mobile app (`artifacts/fitai`)

### Folder purposes

| Folder | Purpose |
|--------|---------|
| [app/](artifacts/fitai/app) | **expo-router route tree only** — `_layout.tsx`, route groups `(auth)`, `(tabs)`, dynamic `workout/[id]`, thin re-exports to `screens/`. |
| [screens/](artifacts/fitai/screens) | Screen implementations: `auth/*`, `tabs/*`, and stack/modal screens at top level. |
| [navigation/](artifacts/fitai/navigation) | Shared navigation config: stack options, route path constants, linking prefixes. |
| [components/](artifacts/fitai/components) | Reusable UI (modals, tab bar, lists, timers, etc.). |
| [contexts/](artifacts/fitai/contexts) | `FitnessContext`, `SocialContext` (global app state + AsyncStorage). |
| [hooks/](artifacts/fitai/hooks) | e.g. `useColors`. |
| [constants/](artifacts/fitai/constants) | Workouts, achievements, colors, accents. |
| [lib/](artifacts/fitai/lib) | Pure helpers (`smartRecommendations`, `workoutDisplay`). |
| [assets/](artifacts/fitai/assets) | Icons/images referenced from Expo config. |
| [scripts/](artifacts/fitai/scripts), [server/](artifacts/fitai/server) | Build/serve helpers |

### Navigation structure

- **Root:** [app/_layout.tsx](artifacts/fitai/app/_layout.tsx) — Clerk, React Query, fonts, splash, `FitnessProvider`, nested `ErrorBoundary`, root `Stack`.
- **Auth:** [app/(auth)/_layout.tsx](artifacts/fitai/app/(auth)/_layout.tsx) — stack of auth screens (implementations under [screens/auth/](artifacts/fitai/screens/auth)).
- **Tabs:** [app/(tabs)/_layout.tsx](artifacts/fitai/app/(tabs)/_layout.tsx) — `Tabs` + `CustomTabBar`; tab bodies under [screens/tabs/](artifacts/fitai/screens/tabs).
- **Entry / gating:** [app/index.tsx](artifacts/fitai/app/index.tsx) → [screens/IndexScreen.tsx](artifacts/fitai/screens/IndexScreen.tsx) (Clerk + `AsyncStorage` username flag).
- **Stack siblings:** notifications, feed, leaderboard, stats, health/recovery detail, scheduling, profile editing, privacy/help, workout library editor, workout detail modal — each `app/*.tsx` re-exports matching `screens/*Screen.tsx`.
- **Navigation helpers:** [navigation/rootStackOptions.ts](artifacts/fitai/navigation/rootStackOptions.ts), [navigation/routePaths.ts](artifacts/fitai/navigation/routePaths.ts), [navigation/linking.ts](artifacts/fitai/navigation/linking.ts).

### State management

- **FitnessContext:** Profile, workouts, scheduling, XP, achievements, notifications, health metrics; storage key `@regime_data_v2`, namespaced per Clerk user.
- **SocialContext:** Posts, comments, reactions; depends on FitnessContext; storage `@regime_social_v1`.

### Services / integrations

- **HTTP:** `@workspace/api-client-react`; `setBaseUrl` when `EXPO_PUBLIC_DOMAIN` is set ([\_layout.tsx](artifacts/fitai/app/_layout.tsx)).
- **Auth:** `@clerk/expo` (native + web; web entry special-cased in `IndexScreen`).
- **Media:** `expo-image-picker` (profile, social composer); iOS/Android permission strings configured via `expo-image-picker` plugin in [app.json](artifacts/fitai/app.json).
- **Deep links:** Scheme `regime` — see [navigation/linking.ts](artifacts/fitai/navigation/linking.ts).

### Native / build

- **Expo config:** [app.json](artifacts/fitai/app.json) — bundle ID / package `com.regime.app`, splash, plugins (`expo-router`, `expo-font`, `expo-web-browser`, `expo-image-picker`).
- **EAS:** [eas.json](artifacts/fitai/eas.json) — `development`, `preview`, `production` build profiles (fill credentials and policy URLs before store submit).
- **`expo.extra`:** Placeholder `privacyPolicyUrl` — replace with production URL before App Store / Play submission.

Commited `ios/` and `android/` folders are **not** required for managed workflow; they are produced by prebuild/EAS as needed.

## Backend (`artifacts/api-server`)

- Entry: `src/index.ts`, `src/app.ts`.
- Routes: `src/routes/` (e.g. health, AI coach) — align with [lib/api-spec](lib/api-spec) as the contract evolves.

## Documentation layout

- [docs/archive/](docs archive) — superseded code maps, scratch files, archived `attached_assets` prompts/media.
- [REGIME_CODEMAP.md](REGIME_CODEMAP.md), [replit.md](replit.md) — supplementary notes (environment, product); prefer this file for current layout.

## Root scripts

- `pnpm run typecheck` — workspace typecheck.
- `pnpm run fitai:start` / variants — Expo dev (see root [package.json](package.json)).
