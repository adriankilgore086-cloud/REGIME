/** Typed route path strings for expo-router (use with `as const` or casts where router APIs require Href). */

export const routes = {
  index: "/",
  tabs: "/(tabs)",
  auth: {
    username: "/(auth)/username",
    welcome: "/(auth)/welcome",
    signIn: "/(auth)/sign-in",
    signUp: "/(auth)/sign-up",
    onboarding: "/(auth)/onboarding",
    forgotPassword: "/(auth)/forgot-password",
  },
  notifications: "/notifications",
  feed: "/feed",
  workoutLibraryEditor: "/workout-library-editor",
  leaderboard: "/leaderboard",
  statsOverview: "/stats-overview",
  editProfile: "/edit-profile",
  privacySecurity: "/privacy-security",
  helpSupport: "/help-support",
  healthDetail: "/health-detail",
  recoveryDetail: "/recovery-detail",
  bodyMetrics: "/body-metrics",
  scheduleWorkoutDetail: "/schedule-workout-detail",
} as const;

export function workoutDetailPath(workoutId: string): string {
  return `/workout/${workoutId}`;
}
