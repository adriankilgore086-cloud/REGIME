# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a premium Expo/React Native fitness app ("Regime") and an Express API server.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

---

## Regime — Premium Fitness App (`artifacts/fitai`)

**Expo SDK 54 · expo-router v6 · @clerk/expo v3.2.7**

### Design System
- Background: `#0D0D0D`, Card: `#1A1A1A`, Primary: `#FFFFFF`, Muted: `#A1A1A1`, Border: `#2E2E2E`
- Accent: `#FF2D78`, Success: `#7BE0B8`, Gold: `#F3D27A`, Purple: `#A78BFA`, Blue: `#8FB8FF`
- Fonts: `Poppins_700Bold` (headings), `Inter_*` (body)
- Minimal dark luxury aesthetic — no gradient bubbles, no large emojis, no playful copy

### Auth Flow
- App root (`app/index.tsx`) checks `@regime_username` in AsyncStorage
- Missing → `/(auth)/username` (username creation)
- Present → `/(auth)/welcome` (Clerk sign-in — this IS the login screen)
- Signed in → `/(tabs)` (main app)

### Tab Structure
- Tab 0: `calendar.tsx` — Calendar scheduling with weekly/monthly views, weekly report modal
- Tab 1: `goals.tsx` — Goals & AI Fitness Roadmap
- Tab 2: `index.tsx` (Home) — Center tab, main hub
- Tab 3: `health.tsx` — Health Analytics
- Tab 4: `profile.tsx` — Profile, Social, Leaderboard tabs

### Key Screens & Routes
- `/leaderboard` — Full global leaderboard with animated podium, XP/Streak/Sessions filters
- `/notifications` — Notification center (streak, achievement, AI, social, reminder types)
- `/workout/[id]` — Workout detail + exercise checklist
- `/(auth)/username` — Username creation (first-time)
- `/(auth)/welcome` — Clerk sign-in
- `/(auth)/sign-up` — Clerk sign-up
- `/(auth)/forgot-password` — Password reset (pre-existing Clerk v3 API mismatch error)

### Features Built
- **WorkoutPlayerModal** (`components/WorkoutPlayerModal.tsx`) — Full-screen workout player with swipe-to-complete exercise cards, animated intensity bar, music player UI (adapts by intensity → genre/BPM), motivational quotes, rest timer, completion celebration
- **Leaderboard** (`app/leaderboard.tsx`) — Animated podium for top 3, full rankings list, filter tabs (XP/Streak/Sessions), MyStatsCard with coaching message
- **Activity Heatmap** (`app/(tabs)/health.tsx`) — GitHub-style 15-week workout activity grid with intensity-based coloring
- **Body Metrics Card** (`app/(tabs)/health.tsx`) — Weight, Height, BMI, Est. TDEE derived from user profile
- **Consistency Tracker** (`app/(tabs)/goals.tsx`) — 8-week calendar grid showing completed vs missed sessions, today highlight, streak pill
- **Personal Records Board** (`app/(tabs)/index.tsx`) — Horizontal scroll of key lifts (Bench, Squat, Deadlift, OHP, Pull-ups) with gain badges
- **Profile Leaderboard Tab** (`app/(tabs)/profile.tsx`) — Premium redirect card to `/leaderboard` + top 3 preview, replaces old inline data
- **Social Feed** (`app/(tabs)/profile.tsx`) — Community feed with post types, reactions (fire/flex/clap), comments, replies, half-screen bottom sheet create post modal, tappable avatars (UserProfileSheet), isPremium gate
- **Ghost Mode Card** (`app/(tabs)/index.tsx`) — vs last week comparison
- **AI Coach Chat** (`components/AIChatModal.tsx`) — Streaming chat powered by `/api/ai/coach` proxy
- **Gamification** — XP system, levels, ranks, achievements/badges, rewards overlay (`FitnessContext.tsx`)
- **Calendar Scheduling** — Schedule/skip workouts, weekly report modal
- **Notification Pill Banner** (`components/NotificationBanner.tsx`) — iOS Live Activity-style animated pill; slides in from top; auto-dismisses after 4s; swipe-up or tap to dismiss; queued delivery; wired to workout completions, achievements, and social posts

### Context / State
- `FitnessContext.tsx` — All fitness state (profile, stats, workouts, goals, health metrics, achievements, notifications); `UserProfile` now includes `username`, `isPremium`, `unlockedTitles`; `AppNotification` now includes `route` and `'social'` type; `updateProfile` auto-derives `@username` from name
- `SocialContext.tsx` — Social posts, reactions, comments; `SocialPost` includes `mediaWidth`/`mediaHeight`; calls `addNotification` on new post
- `AsyncStorage` key: `@regime_data_v2`

### Premium / Identity
- `isPremium` flag on `UserProfile` — gates the Social Feed tab in `profile.tsx`
- Dev toggle available in Settings action sheet (iOS) and Alert (Android)
- `unlockedTitles` array replaces old static `IDENTITY_TITLES` constant — user picks active title from their earned set
- `username` auto-derived as `@handle` from display name on every profile update

### Important Notes
- `welcome.tsx` IS the login screen (not `sign-in.tsx`)
- Only pre-existing TS error: `app/(auth)/forgot-password.tsx` — unrelated Clerk v3 API mismatch
- Expo workflow: `artifacts/fitai: expo`
- API server fails with EADDRINUSE on restart (port conflict) — this is a pre-existing infra issue, not a code bug
