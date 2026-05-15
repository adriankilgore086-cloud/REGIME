/**
 * Deep link prefixes for expo-router / Expo Linking.
 * Scheme matches app.json expo.scheme ("regime").
 * @see https://docs.expo.dev/guides/linking/
 */
export const APP_SCHEME = "regime";

export const appLinkingPrefixes: string[] = [`${APP_SCHEME}://`];
