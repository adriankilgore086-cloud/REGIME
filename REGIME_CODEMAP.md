# Regime Code Map

## What this is
A compact, LLM-friendly map of the app structure and how the pieces connect.

## Product
Regime is a premium fitness app built with Expo/React Native plus an Express API. It focuses on workouts, AI coaching, progress tracking, health metrics, and social sharing.

## Main parts
- `artifacts/fitai` — mobile app
- `artifacts/api-server` — backend API
- `lib/api-spec` — API contract source
- `lib/api-client-react` — generated API client/hooks
- `lib/api-zod` — generated schemas
- `lib/db` — database scaffold

## Mobile app flow
- `app/_layout.tsx` sets up Clerk, React Query, fonts, error handling, and providers
- `app/index.tsx` routes users into auth or the main app
- `app/(auth)/` handles welcome, sign-in, sign-up, forgot password, and username setup
- `app/(tabs)/_layout.tsx` defines the tab bar and swipe navigation
- Main tabs: calendar, library, goals, home, health, profile
- Other screens: workout detail/player, notifications, leaderboard, stats, health detail, recovery detail, body metrics, edit profile, privacy/security, help/support

## State and data
- `contexts/FitnessContext.tsx` stores profile, stats, workouts, goals, achievements, health metrics, and notifications in AsyncStorage
- `contexts/SocialContext.tsx` stores social posts, comments, and reactions in AsyncStorage
- Data is namespaced by Clerk user ID
- There is no full backend database usage yet for app data

## Core logic
- `constants/workouts.ts` defines workout templates, XP rewards, colors, level math, and rank math
- `constants/achievements.ts` defines achievement rules and badge rarity colors
- Completing a workout updates XP, streaks, calories, minutes, achievements, and notifications

## Key UI components
- `AIChatModal.tsx` — AI coach chat
- `WorkoutPlayerModal.tsx` — live workout execution
- `CreatePostModal.tsx` — social post composer
- `RewardOverlay.tsx` — XP/achievement celebration
- `NotificationBanner.tsx` — queued alerts
- `CustomTabBar.tsx` — tab navigation UI
- `WorkoutSwipeCard.tsx` — swipe actions for workouts
- `XPProgressBar.tsx` — XP progress display
- `StatCard.tsx` — reusable metric card
- `WorkoutTimer.tsx` — countdown timer

## API flow
- `lib/api-spec/openapi.yaml` is the source of truth for routes
- `lib/api-client-react` is generated from that spec
- `app/_layout.tsx` calls `setBaseUrl()` so the app talks to the Replit API domain
- `AIChatModal` calls `POST /api/ai/coach`
- Health checks call `GET /api/healthz`

## Backend flow
- `src/index.ts` reads `PORT` and starts the server
- `src/app.ts` mounts middleware and the `/api` router
- `src/routes/health.ts` handles health checks
- `src/routes/ai.ts` handles the AI coach endpoint
- If OpenAI env vars are missing, the AI route returns a fallback motivational reply

## Important env vars
- `CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_DOMAIN`
- `EXPO_PUBLIC_REPL_ID`
- `EXPO_PACKAGER_PROXY_URL`
- `REACT_NATIVE_PACKAGER_HOSTNAME`
- `PORT`
- `NODE_ENV`
- `AI_INTEGRATIONS_OPENAI_BASE_URL`
- `AI_INTEGRATIONS_OPENAI_API_KEY`

## Important files to inspect first
- `artifacts/fitai/app/_layout.tsx`
- `artifacts/fitai/contexts/FitnessContext.tsx`
- `artifacts/fitai/contexts/SocialContext.tsx`
- `artifacts/fitai/constants/workouts.ts`
- `artifacts/fitai/constants/achievements.ts`
- `artifacts/api-server/src/app.ts`
- `artifacts/api-server/src/routes/ai.ts`
- `lib/api-spec/openapi.yaml`
- `lib/api-client-react/src/custom-fetch.ts`
