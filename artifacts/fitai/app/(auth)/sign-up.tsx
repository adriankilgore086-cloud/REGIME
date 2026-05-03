import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSignUp, useSSO } from "@clerk/expo";
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

  // v3 API: useSignUp returns { signUp, errors, fetchStatus } — no isLoaded/setActive
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [code, setCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);

  const handleSignUp = async () => {
    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) return;
    await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          if (url.startsWith("http")) {
            // web fallback
          } else {
            router.replace("/(tabs)");
          }
        },
      });
    }
  };

  const handleGoogle = useCallback(async () => {
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async ({ decorateUrl }) => {
            router.replace("/(tabs)");
          },
        });
      }
    } catch (e: any) {
      // error handled via errors object from hook
    } finally {
      setGoogleLoading(false);
    }
  }, [startSSOFlow]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const emailError = errors?.fields?.emailAddress?.message;
  const passwordError = errors?.fields?.password?.message;
  const codeError = errors?.fields?.code?.message;
  const globalError = errors?.global?.[0]?.message;

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
          <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: codeError ? "#FF4B4B" : colors.border, width: "100%" }]}>
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
          {!!codeError && <Text style={styles.fieldError}>{codeError}</Text>}
          {!!globalError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#FF4B4B" />
              <Text style={styles.errorText}>{globalError}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={fetchStatus === "fetching" || code.length < 6}
            style={[styles.primaryBtn, { opacity: code.length < 6 ? 0.6 : 1, width: "100%" }]}
          >
            <LinearGradient colors={["#8FB8FF", "#6B9EFF"]} style={styles.primaryBtnGrad}>
              {fetchStatus === "fetching"
                ? <ActivityIndicator color="#0D0D0D" />
                : <Text style={styles.primaryBtnText}>Verify & Start Training</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signUp.verifications.sendEmailCode()} style={styles.resendBtn}>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={{ marginTop: 20, marginBottom: 32 }}>
          <LinearGradient colors={["#8FB8FF", "#6B9EFF"]} style={[styles.logoIcon, { marginBottom: 20 }]}>
            <Ionicons name="flash" size={22} color="#0D0D0D" />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.foreground }]}>Join Regime</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Start your transformation today</Text>
        </View>

        <TouchableOpacity
          onPress={handleGoogle}
          disabled={googleLoading}
          style={[styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {googleLoading
            ? <ActivityIndicator size="small" color={colors.foreground} />
            : <>
              <Ionicons name="logo-google" size={18} color={colors.foreground} />
              <Text style={[styles.googleText, { color: colors.foreground }]}>Sign up with Google</Text>
            </>
          }
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: emailError ? "#FF4B4B" : colors.border }]}>
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
            {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Password</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.input, borderColor: passwordError ? "#FF4B4B" : colors.border }]}>
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
          onPress={handleSignUp}
          disabled={!email || !password || fetchStatus === "fetching"}
          style={[styles.primaryBtn, { opacity: (!email || !password) ? 0.6 : 1 }]}
        >
          <LinearGradient colors={["#8FB8FF", "#6B9EFF"]} style={styles.primaryBtnGrad}>
            {fetchStatus === "fetching"
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
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.8, marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 0 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, borderWidth: 1, paddingVertical: 14, marginBottom: 20 },
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
});
