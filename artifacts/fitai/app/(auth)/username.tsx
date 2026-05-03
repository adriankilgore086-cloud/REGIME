import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function UsernameScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    const taken = (await AsyncStorage.getItem("@regime_username"))?.toLowerCase();
    if (taken === name.toLowerCase()) {
      setError("That username is already in use.");
      setSaving(false);
      return;
    }
    await AsyncStorage.setItem("@regime_username", name);
    setSaving(false);
    router.replace("/(auth)/welcome");
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: botPad + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <LinearGradient colors={["#FFFFFF", "#E0E0E0"]} style={styles.logoIcon}>
            <Ionicons name="flash" size={22} color="#0D0D0D" />
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
  logoRow: { alignItems: "center", marginBottom: 28 },
  logoIcon: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  appName: { fontSize: 34, fontFamily: "Poppins_700Bold", letterSpacing: -1 },
  title: { fontSize: 26, fontFamily: "Poppins_700Bold", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8, marginBottom: 24, lineHeight: 21 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 100, borderWidth: 1, height: 54, overflow: "hidden" },
  inputIcon: { marginLeft: 18 },
  inputField: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", paddingHorizontal: 12, height: "100%" },
  errorText: { color: "#FF4B4B", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8, marginLeft: 18 },
  primaryBtn: { marginTop: 18, borderRadius: 100, overflow: "hidden" },
  primaryBtnGrad: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0D0D0D" },
});