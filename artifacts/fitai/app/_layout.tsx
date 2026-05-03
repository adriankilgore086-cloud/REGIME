import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache as nativeTokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { setBaseUrl } from "@workspace/api-client-react";
import React, { Component, useEffect } from "react";
import { View, Text, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FitnessProvider } from "@/contexts/FitnessContext";

SplashScreen.preventAutoHideAsync();

const BG = "#08081A";
const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

const queryClient = new QueryClient();
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;
// expo-secure-store doesn't work on web; let Clerk use its default browser storage
const tokenCache = Platform.OS !== "web" ? nativeTokenCache : undefined;

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  componentDidCatch(e: Error) { console.error("[RootError]", e.message); }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: "#FF2D78", fontSize: 18, fontWeight: "700", marginBottom: 12, textAlign: "center" }}>
            Something went wrong
          </Text>
          <Text style={{ color: "#FFFFFF", fontSize: 13, textAlign: "center" }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Load vector icon fonts asynchronously without blocking render
  useEffect(() => {
    Font.loadAsync({
      ...Ionicons.font,
      ...Feather.font,
      ...MaterialCommunityIcons.font,
    }).catch(() => {});
  }, []);

  // On web, don't block render for fonts — they load asynchronously
  if (!fontsLoaded && !fontError && Platform.OS !== "web") {
    return <View style={{ flex: 1, backgroundColor: BG }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ErrorBoundary>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
          <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
              <ErrorBoundary>
                <FitnessProvider>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: BG },
                      animation: Platform.OS === "web" ? "none" : "fade",
                    }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="workout/[id]"
                      options={{ presentation: "modal", contentStyle: { backgroundColor: BG } }}
                    />
                  </Stack>
                </FitnessProvider>
              </ErrorBoundary>
            </QueryClientProvider>
          </SafeAreaProvider>
        </ClerkProvider>
      </ErrorBoundary>
    </View>
  );
}
