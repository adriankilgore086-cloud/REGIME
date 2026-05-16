import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@shared/hooks/useColors";
import { useSignIn, useSignUp } from "@clerk/expo";
import * as Haptics from "expo-haptics";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";

export default function UsernameScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const heroRise = useSharedValue(48);
  const heroOpacity = useSharedValue(0);
  const formRise = useSharedValue(64);
  const formOpacity = useSharedValue(0);
  const buttonRise = useSharedValue(84);
  const buttonOpacity = useSharedValue(0);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    heroRise.value = withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) });
    heroOpacity.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
    formRise.value = withDelay(80, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));
    formOpacity.value = withDelay(80, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
    buttonRise.value = withDelay(150, withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }));
    buttonOpacity.value = withDelay(150, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, []);

  const heroAnimated = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroRise.value }],
  }));

  const formAnimated = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formRise.value }],
  }));

  const buttonAnimated = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonRise.value }],
  }));

  const handleContinue = async () => {
    const name = username.trim();
    if (!name) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("Enter a username or email.");
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    try {
      // Keep your existing local storage wipe/save just in case the app needs it
      await AsyncStorage.setItem("@regime_username", name);
      await AsyncStorage.removeItem("@regime_data_v2");

      // 1. Ask Clerk if this user exists
      await signIn.create({ identifier: name });

      // 2. If they DO exist, route to Sign-In and pre-fill the box
      router.push({ 
        pathname: "/(auth)/sign-in", 
        params: { prefill: name } 
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (err: any) {
      // 3. If Clerk can't find them, route to Sign-Up and pre-fill the box
      if (err.errors && err.errors[0]?.code === 'form_identifier_not_found') {
        router.push({ 
          pathname: "/(auth)/sign-up", 
          params: { prefill: name } 
        });
        void Haptics.selectionAsync();
      } else {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(err.errors?.[0]?.message || "An error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topPad + 18, paddingBottom: botPad + 24 }]} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.logoRow, heroAnimated]}>
          <LinearGradient colors={[colors.primary, colors.warmGray]} style={styles.logoIcon}>
            <Ionicons name="flash" size={28} color={colors.primaryForeground} />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.foreground }]}>ALIAS</Text>
        </Animated.View>

        <Animated.View style={formAnimated}>
          <Text style={[styles.title, { color: colors.foreground, textTransform: "uppercase" }]}>A NEW ROUTINE FOR THE BETTER.</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Set your entry point to Regime.</Text>

          <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: error ? colors.destructive : colors.border }]}>
            <Ionicons name="person-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputField, { color: colors.foreground }]}
              placeholder="Username or email"
              placeholderTextColor={colors.mutedForeground}
              value={username}
              onChangeText={(t) => { setUsername(t); setError(""); }}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={64}
            />
          </View>
          {!!error && <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>}
        </Animated.View>

        <Animated.View style={buttonAnimated}>
          <TouchableOpacity onPress={handleContinue} disabled={saving} style={styles.primaryBtn}>
            <LinearGradient colors={[colors.primary, colors.warmGray]} style={styles.primaryBtnGrad}>
              {saving ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>JOIN</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, justifyContent: "center" },
  logoRow: { alignItems: "center", marginBottom: 24 },
  logoIcon: { width: 74, height: 74, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  appName: { fontSize: 30, fontFamily: "Poppins_700Bold", letterSpacing: -0.8 },
  title: { fontSize: 26, fontFamily: "Poppins_700Bold", letterSpacing: -0.4, textAlign: "center" },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8, marginBottom: 22, lineHeight: 22 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 100, borderWidth: 1, height: 72, overflow: "hidden" },
  inputIcon: { marginLeft: 18 },
  inputField: { flex: 1, fontSize: 21, fontFamily: "Inter_400Regular", paddingHorizontal: 12, height: "100%" },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8, marginLeft: 18 },
  primaryBtn: { marginTop: 18, borderRadius: 100, overflow: "hidden" },
  primaryBtnGrad: { paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});