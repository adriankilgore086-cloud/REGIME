import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from "react-native";
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
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleContinue = async () => {
    const name = username.trim();
    if (name.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    setSaving(true);
    const existingName = (await AsyncStorage.getItem("@regime_username"))?.trim().toLowerCase();
    const email = (await AsyncStorage.getItem(`@regime_username_email:${name.toLowerCase()}`))?.trim();
    if (existingName === name.toLowerCase() && email) {
      await signIn.create({ identifier: email });
      setSaving(false);
      router.replace("/(auth)/welcome");
      return;
    }
    await signUp.create({ emailAddress: `${name.toLowerCase()}@regime.app`, password: `${name.toLowerCase()}-Regime1!` });
    await AsyncStorage.setItem("@regime_username", name);
    await AsyncStorage.setItem(`@regime_username_email:${name.toLowerCase()}`, `${name.toLowerCase()}@regime.app`);
    await AsyncStorage.setItem("@regime_username", name);
    setSaving(false);
    router.replace("/(auth)/welcome");
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <LinearGradient colors={["#FFFFFF", "#E0E0E0"]} style={styles.logoIcon}>
            <Ionicons name="flash" size={34} color="#0D0D0D" />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.foreground }]}>Regime</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Create your username</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Choose a unique name before signing in.</Text>

        <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: error ? "#FF4B4B" : colors.border }]}>
          <Ionicons name="person-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            ref={inputRef}
            style={[styles.inputField, { color: colors.foreground }]}
            placeholder="Username"
            placeholderTextColor={colors.mutedForeground}
            value={username}
            onChangeText={(t) => { setUsername(t); setError(""); }}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={24}
          />
        </View>
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity onPress={handleContinue} disabled={saving} style={styles.primaryBtn}>
          <LinearGradient colors={["#FFFFFF", "#E8E8E8"]} style={styles.primaryBtnGrad}>
            {saving ? <ActivityIndicator color="#0D0D0D" /> : <Text style={styles.primaryBtnText}>Continue</Text>}
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
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 100, borderWidth: 1, height: 72, overflow: "hidden" },
  inputIcon: { marginLeft: 18 },
  inputField: { flex: 1, fontSize: 21, fontFamily: "Inter_400Regular", paddingHorizontal: 12, height: "100%" },
  errorText: { color: "#FF4B4B", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8, marginLeft: 18 },
  primaryBtn: { marginTop: 18, borderRadius: 100, overflow: "hidden" },
  primaryBtnGrad: { paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0D0D0D" },
});