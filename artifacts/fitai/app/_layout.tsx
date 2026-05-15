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
import { ClerkProvider, ClerkLoaded } from "@clerk/expo";
import { tokenCache as nativeTokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { setBaseUrl } from "@workspace/api-client-react";
import React, { useEffect, useState, useRef } from "react";
import { View, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { FitnessProvider, AppNotification, useFitness } from "@/contexts/FitnessContext";
import { SocialProvider } from "@/contexts/SocialContext";
import NotificationBanner from "@/components/NotificationBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { rootStackScreenOptions, workoutModalScreenOptions, ROOT_STACK_BG } from "@/navigation/rootStackOptions";

SplashScreen.preventAutoHideAsync();

const BG = ROOT_STACK_BG;
const domain = process.env.EXPO_PUBLIC_DOMAIN;
if (domain) setBaseUrl(`https://${domain}`);

const queryClient = new QueryClient();
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;
const tokenCache = Platform.OS !== "web" ? nativeTokenCache : undefined;

function InnerLayout() {
  const { notifications } = useFitness();
  const [bannerQueue, setBannerQueue] = useState<AppNotification[]>([]);
  const seenIds = useRef(new Set<string>());

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
        <Stack screenOptions={rootStackScreenOptions}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="feed" />
          <Stack.Screen name="workout-library-editor" />
          <Stack.Screen name="workout/[id]" options={workoutModalScreenOptions} />
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
      <ErrorBoundary onError={(e) => console.error("[RootError]", e.message)}>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} proxyUrl={proxyUrl}>
          {Platform.OS === "web" ? (
            <SafeAreaProvider>
              <QueryClientProvider client={queryClient}>
                <ErrorBoundary onError={(e) => console.error("[RootError]", e.message)}>
                  <FitnessProvider>
                    <InnerLayout />
                  </FitnessProvider>
                </ErrorBoundary>
              </QueryClientProvider>
            </SafeAreaProvider>
          ) : (
            <ClerkLoaded>
            <SafeAreaProvider>
              <QueryClientProvider client={queryClient}>
                <ErrorBoundary onError={(e) => console.error("[RootError]", e.message)}>
                  <FitnessProvider>
                    <InnerLayout />
                  </FitnessProvider>
                </ErrorBoundary>
              </QueryClientProvider>
            </SafeAreaProvider>
            </ClerkLoaded>
          )}
        </ClerkProvider>
      </ErrorBoundary>
    </View>
  );
}
