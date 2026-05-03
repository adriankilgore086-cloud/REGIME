import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, Platform } from "react-native";

export default function Index() {
  // On web, Clerk cannot reach its auth servers in the Replit sandbox.
  // Go straight to welcome — sign-in/sign-up pages still call Clerk from there.
  if (Platform.OS === "web") {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Native: wait for Clerk then route based on auth state
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#08081A" }}>
        <ActivityIndicator color="#00D4FF" size="large" />
      </View>
    );
  }

  return <Redirect href={isSignedIn ? "/(tabs)" : "/(auth)/welcome"} />;
}
