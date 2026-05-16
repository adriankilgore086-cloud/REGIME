import type { ConfigContext, ExpoConfig } from "expo/config";

const projectId = process.env.EAS_PROJECT_ID;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Regime",
  slug: "regime",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "regime",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0D0D0D",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.regime.fitai",
    buildNumber: "1",
    infoPlist: {
      NSHealthShareUsageDescription:
        "Regime uses HealthKit to track your workouts and health metrics.",
      NSHealthUpdateUsageDescription:
        "Regime writes workout data to Apple Health.",
      NSMotionUsageDescription:
        "Regime uses motion data for workout intensity tracking.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0D0D0D",
    },
    package: "com.regime.fitai",
    versionCode: 1,
    permissions: [
      "android.permission.ACTIVITY_RECOGNITION",
      "android.permission.BODY_SENSORS",
    ],
    softwareKeyboardLayoutMode: "resize",
  },
  web: {
    favicon: "./assets/icon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    [
      "expo-build-properties",
      {
        ios: { newArchEnabled: true },
        android: { newArchEnabled: true },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: false,
  },
  extra: {
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: projectId ? { projectId } : undefined,
  },
  updates: projectId
    ? {
        url: `https://u.expo.dev/${projectId}`,
      }
    : undefined,
  runtimeVersion: { policy: "appVersion" },
});
