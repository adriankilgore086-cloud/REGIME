# Production Readiness

## Verified In This Branch

- Expo app config is dynamic and EAS-ready.
- Clerk routing and app auth flow are preserved.
- OpenAPI covers auth, profile, workouts, goals, health, gamification, social, leaderboard, notifications, and AI coach.
- Generated clients and Zod schemas are ignored and regenerated from `lib/api-spec`.
- Server routes use auth middleware, Zod validation, and a shared error handler.
- App source is organized under `src` feature, shared, and store modules.
- Server persistence is wired through generated React Query hooks with local fallback cache.
- Push, analytics, and crash reporting initialize only when configured.
- `pnpm run typecheck` passes.

## Required Before Store Submission

- Replace placeholder app icons/splash assets with final production artwork.
- Configure real Clerk, API, EAS project, Sentry, PostHog, and store credentials in CI/EAS secrets.
- Run an EAS preview build for iOS and Android.
- Validate push notification delivery on physical devices.
- Run full app navigation, auth, workout completion, social posting, and profile update smoke tests.
- Confirm privacy policy, app store metadata, and data collection disclosures match enabled services.
