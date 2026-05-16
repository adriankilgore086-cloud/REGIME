import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/expo";
import { tokenCache as nativeTokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import React, { Component, useEffect, useState, useRef } from "react";
import { View, Text, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FitnessProvider, AppNotification, useFitness } from "@store/FitnessContext";
import { SocialProvider } from "@store/SocialContext";
import { ErrorBoundary } from "@shared/components/layout/ErrorBoundary";
import NotificationBanner from "@shared/components/ui/NotificationBanner";

SplashScreen.preventAutoHideAsync();

const BG = "#0D0D0D";
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (apiUrl) setBaseUrl(apiUrl);
else if (domain) setBaseUrl(`https://${domain}`);

const queryClient = new QueryClient();
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;
const tokenCache = Platform.OS !== "web" ? nativeTokenCache : undefined;

class RootErrorBoundary extends Component<
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
          <Text style={{ color: "#F5F5F5", fontSize: 13, textAlign: "center" }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function InnerLayout() {
  const { notifications } = useFitness();
  const { getToken } = useAuth();
  const [bannerQueue, setBannerQueue] = useState<AppNotification[]>([]);
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read);
    const fresh = unread.filter((n) => !seenIds.current.has(n.id));
    if (fresh.length > 0) {
      fresh.forEach((n) => seenIds.current.add(n.id));
      setBannerQueue((q) => [...q, ...fresh]);
    }
  }, [notifications]);

  return (
    <View style={{ flex: 1, pointerEvents: "box-none" }}>
      <SocialProvider>
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
          <Stack.Screen name="notifications" />
          <Stack.Screen name="feed" />
          <Stack.Screen name="workout-library-editor" />
          <Stack.Screen
            name="workout/[id]"
            options={{ presentation: "modal", contentStyle: { backgroundColor: BG } }}
          />
        </Stack>
      </SocialProvider>
      {bannerQueue.length > 0 && (
        <NotificationBanner
          key={bannerQueue[0].id}
          notification={bannerQueue[0]}
          onDismiss={() => setBannerQueue((q) => q.slice(1))}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    Font.loadAsync({
      ...Ionicons.font,
      ...Feather.font,
      ...MaterialCommunityIcons.font,
    }).catch(() => {});
  }, []);

  if (!fontsLoaded && !fontError && Platform.OS !== "web") {
    return <View style={{ flex: 1, backgroundColor: BG }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ErrorBoundary onError={(error) => console.error("[RootError]", error.message)}>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
          {Platform.OS === "web" ? (
            <SafeAreaProvider>
              <QueryClientProvider client={queryClient}>
                <RootErrorBoundary>
                  <FitnessProvider>
                    <InnerLayout />
                  </FitnessProvider>
                </RootErrorBoundary>
              </QueryClientProvider>
            </SafeAreaProvider>
          ) : (
            <ClerkLoaded>
            <SafeAreaProvider>
              <QueryClientProvider client={queryClient}>
                <RootErrorBoundary>
                  <FitnessProvider>
                    <InnerLayout />
                  </FitnessProvider>
                </RootErrorBoundary>
              </QueryClientProvider>
            </SafeAreaProvider>
            </ClerkLoaded>
          )}
        </ClerkProvider>
      </ErrorBoundary>
    </View>
  );
}
