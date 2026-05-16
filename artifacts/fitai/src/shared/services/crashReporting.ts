import * as Sentry from "@sentry/react-native";

let initialized = false;

export function initCrashReporting() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || initialized || __DEV__) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enableAutoSessionTracking: true,
    sendDefaultPii: false,
  });
  initialized = true;
}

export function captureException(error: unknown) {
  if (initialized) {
    Sentry.captureException(error);
  }
}
