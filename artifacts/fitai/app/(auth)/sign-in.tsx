import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSignIn, useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // v3 API: useSignIn returns { signIn, errors, fetchStatus } — no isLoaded/setActive
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [showMfa, setShowMfa] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);

  useEffect(() => {
    router.setParams({ auth: "sign-in" });
  }, [router]);

  const handleSubmit = async () => {
    signIn.reset();
    setShowMfa(false);
    setMfaCode("");
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;

    if (signIn.status === "complete") {
      router.replace("/(tabs)");
    } else if (signIn.status === "needs_client_trust") {
      await signIn.mfa.sendEmailCode();
      setShowMfa(true);
    }
  };

  const handleVerifyMfa = async () => {
    await signIn.mfa.verifyEmailCode({ code: mfaCode });
    if (signIn.status === "complete") {
      router.replace("/(tabs)");
    }
  };

  const handleGoogle = useCallback(async () => {
    setGoogleLoading(true);
    try {
      signIn.reset();
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async () => router.replace("/(tabs)"),
        });
      }
    } catch (e: any) {
      // error shown via errors object from hook
    } finally {
      setGoogleLoading(false);
    }
  }, [signIn, startSSOFlow]);

  const handleApple = useCallback(async () => {
    setAppleLoading(true);
    try {
      signIn.reset();
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_apple",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async () => router.replace("/(tabs)"),
        });
      }
    } catch {
    } finally {
      setAppleLoading(false);
    }
  }, [signIn, startSSOFlow, router]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const emailError = errors?.fields?.identifier?.message;
  const passwordError = errors?.fields?.password?.message;
  const globalError = errors?.global?.[0]?.message;

  if (showMfa) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.verifyContainer, { paddingTop: topPad + 40 }]}>
          <View style={[styles.verifyIcon, { backgroundColor: colors.primary + "20" }]}>
            <Ionicons name="shield-checkmark-outline" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Verify your device</Text>
          <Text style={[styles.verifySubtitle, { color: colors.mutedForeground }]}>
            We sent a code to {"\n"}{email}
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: colors.border, width: "100%" }]}>
            <Ionicons name="key-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputField, { color: colors.foreground }]}
              placeholder="6-digit code"
              placeholderTextColor={colors.mutedForeground}
              value={mfaCode}
              onChangeText={setMfaCode}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />
          </View>
          {!!globalError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#FF4B4B" />
              <Text style={styles.errorText}>{globalError}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleVerifyMfa}
            disabled={fetchStatus === "fetching" || mfaCode.length < 6}
            style={[styles.primaryBtn, { opacity: mfaCode.length < 6 ? 0.6 : 1, width: "100%" }]}
          >
            <LinearGradient colors={["#FFFFFF", "#E8E8E8"]} style={styles.primaryBtnGrad}>
              {fetchStatus === "fetching"
                ? <ActivityIndicator color="#0D0D0D" />
                : <Text style={styles.primaryBtnText}>Verify</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signIn.mfa.sendEmailCode()} style={styles.resendBtn}>
            <Text style={[styles.resendText, { color: colors.mutedForeground }]}>Resend code</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { signIn.reset(); setShowMfa(false); }} style={styles.resendBtn}>
            <Text style={[styles.resendText, { color: colors.mutedForeground }]}>Start over</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: botPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={[styles.logoRow, { marginTop: 20 }]}>
          <LinearGradient colors={["#FFFFFF", "#E0E0E0"]} style={styles.logoIcon}>
            <Ionicons name="flash" size={34} color="#0D0D0D" />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.foreground }]}>REGIME</Text>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Get in. Lock in. Earn the next level.</Text>

        <TouchableOpacity onPress={handleGoogle} disabled={googleLoading} style={styles.socialBtn}>
          {googleLoading
            ? <ActivityIndicator size="small" color="#F5F5F5" />
            : <>
              <View style={styles.googleMark}>
                <Ionicons name="logo-google" size={16} color="#4285F4" />
                <View style={styles.googleDotRed} />
                <View style={styles.googleDotYellow} />
                <View style={styles.googleDotGreen} />
              </View>
              <Text style={[styles.googleText, { color: "#F5F5F5" }]}>Continue with Google</Text>
            </>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={handleApple} disabled={appleLoading} style={styles.socialBtn}>
          {appleLoading
            ? <ActivityIndicator size="small" color="#F5F5F5" />
            : <>
              <Ionicons name="logo-apple" size={18} color="#F5F5F5" />
              <Text style={[styles.googleText, { color: "#F5F5F5" }]}>Continue with Apple</Text>
            </>
          }
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>use email</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: emailError ? "#FF4B4B" : colors.border }]}>
              <Ionicons name="mail-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { color: colors.foreground }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Password</Text>
            <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: passwordError ? "#FF4B4B" : colors.border }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { color: colors.foreground }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
          </View>
        </View>

        {!!globalError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color="#FF4B4B" />
            <Text style={styles.errorText}>{globalError}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!email || !password || fetchStatus === "fetching"}
          style={[styles.primaryBtn, { opacity: (!email || !password) ? 0.6 : 1 }]}
        >
          <LinearGradient colors={["#FFFFFF", "#E8E8E8"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {fetchStatus === "fetching"
              ? <ActivityIndicator color="#0D0D0D" />
              : <Text style={styles.primaryBtnText}>Sign In</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.linkRow}>
          <Text style={[styles.linkLabel, { color: colors.mutedForeground }]}>New here? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text style={[styles.linkText, { color: colors.primary }]}>Create account</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={[styles.dividerRow, { marginBottom: 16 }]}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity style={[styles.manageBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="key-outline" size={16} color={colors.mutedForeground} />
            <Text style={[styles.manageBtnText, { color: colors.mutedForeground }]}>Reset password</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  verifyContainer: { flex: 1, paddingHorizontal: 24, alignItems: "center", gap: 16 },
  verifyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  verifySubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  resendBtn: { paddingVertical: 8 },
  resendText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 32 },
  logoIcon: { width: 76, height: 76, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 34, fontFamily: "Inter_700Bold" },
  title: { fontSize: 34, fontFamily: "Inter_700Bold", letterSpacing: -1.1, marginBottom: 6 },
  subtitle: { fontSize: 18, fontFamily: "Inter_500Medium", marginBottom: 28, lineHeight: 26 },
  socialBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 999, borderWidth: 1, paddingVertical: 15, marginBottom: 14, backgroundColor: "#171717", borderColor: "#2A2A2A" },
  googleMark: { width: 18, height: 18, position: "relative", alignItems: "center", justifyContent: "center" },
  googleDotRed: { position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: "#EA4335", top: 2, right: -1 },
  googleDotYellow: { position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: "#FBBC05", bottom: 0, right: 1 },
  googleDotGreen: { position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: "#34A853", bottom: 1, left: 0 },
  googleText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  form: { gap: 16, marginBottom: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  fieldError: { fontSize: 12, color: "#FF4B4B", fontFamily: "Inter_400Regular", marginTop: 2 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 8 },
  inputField: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  eyeBtn: { padding: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  errorText: { fontSize: 13, color: "#FF4B4B", fontFamily: "Inter_400Regular", flex: 1 },
  primaryBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  primaryBtnGrad: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { color: "#0D0D0D", fontSize: 16, fontFamily: "Inter_700Bold" },
  linkRow: { flexDirection: "row", justifyContent: "center" },
  linkLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  linkText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  manageBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 16 },
  manageBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
