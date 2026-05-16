export type AppRouteParams = {
  "/workout/[id]": { id: string };
  "/health-detail": { metric?: string };
  "/schedule-workout-detail": { id?: string };
  "/recovery-detail": undefined;
  "/body-metrics": undefined;
  "/stats-overview": undefined;
  "/workout-library-editor": undefined;
  "/feed": undefined;
  "/leaderboard": undefined;
  "/notifications": undefined;
  "/edit-profile": undefined;
  "/privacy-security": undefined;
  "/help-support": undefined;
};

export type AppRoutePath = keyof AppRouteParams;
