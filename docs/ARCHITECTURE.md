# REGIME Architecture

REGIME is organized as a pnpm monorepo with a generated API boundary between the Expo app and Express server.

## Mobile App

The Expo app keeps route files in `artifacts/fitai/app` and places reusable code under `artifacts/fitai/src`.

- `src/features`: domain modules for workout, gamification, AI coach, social, and fitness persistence hooks.
- `src/store`: compatibility context providers that preserve the existing public app API while delegating feature logic to hooks.
- `src/shared`: layout primitives, API flags, service wrappers, theme, navigation types, and shared UI.

Client persistence is server-backed by default through generated React Query hooks. AsyncStorage remains as the fallback/local cache and for app-only data that should survive offline usage.

## API And Data

`lib/api-spec/openapi.yaml` is the API contract. Orval generates:

- React Query client functions in `lib/api-client-react`.
- Zod request schemas in `lib/api-zod`.

The Express API mounts domain routers under `/api` and uses Clerk middleware to attach the authenticated user. Drizzle schemas in `lib/db` define production tables for users, workouts, goals, health metrics, gamification, social data, and notifications.

## Production Services

Push notifications, analytics, and crash reporting are initialized behind environment-driven wrappers:

- Push: `expo-notifications`, `expo-device`, generated token registration, and Expo push sender helper.
- Analytics: PostHog no-ops unless `EXPO_PUBLIC_POSTHOG_KEY` is configured.
- Crash reporting: Sentry no-ops unless `EXPO_PUBLIC_SENTRY_DSN` is configured and the app is not in development.

Real-time updates should start with generated API polling/SSE before adding a realtime vendor dependency.
