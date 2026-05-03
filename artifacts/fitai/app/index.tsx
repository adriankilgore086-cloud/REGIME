import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function Index() {
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@regime_username").then((value) => {
      setHasUsername(!!value);
    });
  }, []);

  // On web, Clerk cannot reach its auth servers in the Replit sandbox.
  // Go straight to welcome — sign-in/sign-up pages still call Clerk from there.
  if (Platform.OS === "web") {
    return <Redirect href={hasUsername ? "/(auth)/welcome" : "/(auth)/username"} />;
  }

  // Native: wait for Clerk then route based on auth state
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0D0D0D" }}>
        <ActivityIndicator color="#8FB8FF" size="large" />
      </View>
    );
  }

  if (hasUsername === null) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0D0D0D" }}>
        <ActivityIndicator color="#8FB8FF" size="large" />
      </View>
    );
  }

  return <Redirect href={isSignedIn ? "/(tabs)" : hasUsername ? "/(auth)/welcome" : "/(auth)/username"} />;
}
