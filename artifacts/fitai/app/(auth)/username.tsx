import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSignIn, useSignUp } from "@clerk/expo";

export default function UsernameScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleContinue = async () => {
    setSaving(true);
    await signIn.reset();
    await signUp.reset();
    setSaving(false);
    const existingName = await AsyncStorage.getItem("@regime_username");
    router.replace(existingName ? "/(auth)/welcome" : "/(auth)/sign-up");
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <LinearGradient colors={["#FFFFFF", "#E0E0E0"]} style={styles.logoIcon}>
            <Ionicons name="flash" size={34} color="#0D0D0D" />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.foreground }]}>ALIAS</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Create your username</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>A new regime for the better.</Text>

        <TouchableOpacity onPress={handleContinue} disabled={saving} style={styles.primaryBtn}>
          <LinearGradient colors={["#FFFFFF", "#E8E8E8"]} style={styles.primaryBtnGrad}>
            {saving ? <ActivityIndicator color="#0D0D0D" /> : <Text style={styles.primaryBtnText}>Join</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, justifyContent: "center" },
  logoRow: { alignItems: "center", marginBottom: 30 },
  logoIcon: { width: 86, height: 86, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  appName: { fontSize: 42, fontFamily: "Poppins_700Bold", letterSpacing: -1.2 },
  title: { fontSize: 28, fontFamily: "Poppins_700Bold", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 16, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 10, marginBottom: 26, lineHeight: 23 },
  primaryBtn: { marginTop: 18, borderRadius: 100, overflow: "hidden" },
  primaryBtnGrad: { paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0D0D0D" },
});