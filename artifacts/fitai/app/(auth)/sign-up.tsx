import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSignUp, useSSO, useAuth } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const { signUp, setActive } = useSignUp() as any;
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [code, setCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn) router.replace("/(tabs)");
  }, [isSignedIn, router]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);

  const handleSignUp = async () => {
    setAuthError("");
    setSignupLoading(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        username: username.trim(),
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch (e: any) {
      setAuthError(e?.errors?.[0]?.longMessage || "Sign up failed. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleVerify = async () => {
    setAuthError("");
    try {
      const result: any = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete" && setActive) {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setAuthError(e?.errors?.[0]?.longMessage || "Invalid code. Please try again.");
    }
  };

  const handleGoogle = useCallback(async () => {
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive: sa } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && sa) {
        await sa({ session: createdSessionId, navigate: async () => router.replace("/(tabs)") });
      }
    } catch {}
    finally { setGoogleLoading(false); }
  }, [startSSOFlow, router]);

  const handleApple = useCallback(async () => {
    setAppleLoading(true);
    try {
      const { createdSessionId, setActive: sa } = await startSSOFlow({
        strategy: "oauth_apple",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && sa) {
        await sa({ session: createdSessionId, navigate: async () => router.replace("/(tabs)") });
      }
    } catch {}
    finally { setAppleLoading(false); }
  }, [startSSOFlow, router]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const isVerifying =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields?.includes("email_address") &&
    signUp.missingFields?.length === 0;

  if (isVerifying) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.verifyContainer, { paddingTop: topPad + 40 }]}>
          <View style={[styles.verifyIcon, { backgroundColor: colors.primary + "20" }]}>
            <Ionicons name="mail-open-outline" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Check your email</Text>
          <Text style={[styles.verifySubtitle, { color: colors.mutedForeground }]}>
            We sent a 6-digit code to{"\n"}{email}
          </Text>
          <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: colors.border, width: "100%" }]}>
            <Ionicons name="key-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
            <TextInput
              style={[styles.inputField, { color: colors.foreground }]}
              placeholder="6-digit code"
              placeholderTextColor={colors.mutedForeground}
              value={code}
              onChangeText={setCode}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />
          </View>
          {!!authError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#FF4B4B" />
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={code.length < 6}
            style={[styles.primaryBtn, { opacity: code.length < 6 ? 0.6 : 1, width: "100%" }]}
          >
            <LinearGradient colors={["#FFFFFF", "#E8E8E8"]} style={styles.primaryBtnGrad}>
              <Text style={styles.primaryBtnText}>Verify & Start Training</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signUp.prepareEmailAddressVerification({ strategy: "email_code" })} style={styles.resendBtn}>
            <Text style={[styles.resendText, { color: colors.mutedForeground }]}>Resend code</Text>
          </TouchableOpacity>
        </View>
        <View nativeID="clerk-captcha" />
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
        <TouchableOpacity onPress={() => router.replace("/(auth)/welcome")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={{ marginTop: 20, marginBottom: 32 }}>
          <LinearGradient colors={["#FFFFFF", "#E0E0E0"]} style={[styles.logoIcon, { marginBottom: 20 }]}>
            <Ionicons name="flash" size={22} color="#0D0D0D" />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.foreground }]}>Join Regime</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Build the body. Break the excuses.</Text>
        </View>

        <TouchableOpacity onPress={handleGoogle} disabled={googleLoading} style={styles.socialBtn}>
          {googleLoading ? <ActivityIndicator size="small" color="#F5F5F5" /> : <>
            <View style={styles.googleMark}>
              <Ionicons name="logo-google" size={16} color="#4285F4" />
              <View style={styles.googleDotRed} />
              <View style={styles.googleDotYellow} />
              <View style={styles.googleDotGreen} />
            </View>
            <Text style={[styles.googleText, { color: "#F5F5F5" }]}>Sign up with Google</Text>
          </>}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleApple} disabled={appleLoading} style={styles.socialBtn}>
          {appleLoading ? <ActivityIndicator size="small" color="#F5F5F5" /> : <>
            <Ionicons name="logo-apple" size={18} color="#F5F5F5" />
            <Text style={[styles.googleText, { color: "#F5F5F5" }]}>Sign up with Apple</Text>
          </>}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>use email</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>username</Text>
            <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { color: colors.foreground }]}
                placeholder="your_username"
                placeholderTextColor={colors.mutedForeground}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>email</Text>
            <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { color: colors.foreground }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>password</Text>
            <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { color: colors.foreground }]}
                placeholder="Min 8 characters"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {!!authError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color="#FF4B4B" />
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSignUp}
          disabled={!email || !password || !username || signupLoading}
          style={[styles.primaryBtn, { opacity: (!email || !password || !username) ? 0.6 : 1 }]}
        >
          <LinearGradient colors={["#FFFFFF", "#E8E8E8"]} style={styles.primaryBtnGrad}>
            {signupLoading
              ? <ActivityIndicator color="#0D0D0D" />
              : <Text style={styles.primaryBtnText}>Create Account</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.linkRow}>
          <Text style={[styles.linkLabel, { color: colors.mutedForeground }]}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text style={[styles.linkText, { color: colors.primary }]}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
      <View nativeID="clerk-captcha" />
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
  logoIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 34, fontFamily: "Inter_700Bold", letterSpacing: -1.1, marginBottom: 6 },
  subtitle: { fontSize: 18, fontFamily: "Inter_500Medium", marginBottom: 0, lineHeight: 26 },
  socialBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 999, borderWidth: 1, paddingVertical: 15, marginBottom: 14, backgroundColor: "#171717", borderColor: "#2A2A2A" },
  googleMark: { width: 18, height: 18, position: "relative", alignItems: "center", justifyContent: "center" },
  googleDotRed: { position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: "#EA4335", top: 2, right: -1 },
  googleDotYellow: { position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: "#FBBC05", bottom: 0, right: 1 },
  googleDotGreen: { position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: "#34A853", bottom: 1, left: 0 },
  googleText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.2 },
  form: { gap: 16, marginBottom: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
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
});
