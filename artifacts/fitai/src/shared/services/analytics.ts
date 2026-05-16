type AnalyticsClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify?: (id: string, properties?: Record<string, unknown>) => void;
};

let analyticsClient: AnalyticsClient | null = null;

export async function initAnalytics() {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;
  if (!apiKey || analyticsClient) return;

  try {
    const { PostHog } = await import("posthog-react-native");
    analyticsClient = new PostHog(apiKey, host ? { host } : undefined) as unknown as AnalyticsClient;
  } catch {
    analyticsClient = null;
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  analyticsClient?.capture(event, properties);
}

export function identifyUser(id: string, properties?: Record<string, unknown>) {
  analyticsClient?.identify?.(id, properties);
}
