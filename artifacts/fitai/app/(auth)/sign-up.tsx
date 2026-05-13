import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSignUp, useSSO, useAuth } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useRouter, Link, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const redirectUrl = useMemo(() => AuthSession.makeRedirectUri({ path: "oauth-native-callback" }), []);

  const { prefill } = useLocalSearchParams<{ prefill: string }>();
  const [email, setEmail] = useState(prefill?.includes("@") ? prefill : "");
  const [username, setUsername] = useState(prefill && !prefill.includes("@") ? prefill : "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [code, setCode] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn) router.replace("/(tabs)");
  }, [isSignedIn, router]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);

  const handleSignUp = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signUp.reset();
    setCode("");
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        username: username.trim(),
      });
      await signUp.prepareVerification({ strategy: "email_code" });
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleVerify = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await signUp.attemptVerification({ strategy: "email_code", code });
      if (result.status === "complete") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(auth)/onboarding");
      }
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleGoogle = useCallback(async () => {
    setGoogleLoading(true);
    try {
      signUp.reset();
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async () => router.replace("/(auth)/onboarding"),
        });
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGoogleLoading(false);
    }
  }, [redirectUrl, router, signUp, startSSOFlow]);

  const handleApple = useCallback(async () => {
    setAppleLoading(true);
    try {
      signUp.reset();
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_apple",
        redirectUrl,
      });
      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async () => router.replace("/(auth)/onboarding"),
        });
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAppleLoading(false);
    }
  }, [redirectUrl, router, signUp, startSSOFlow]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const emailError = errors?.fields?.emailAddress?.message;
  const passwordError = errors?.fields?.password?.message;
  const usernameError = errors?.fields?.username?.message;
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
          <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: codeError ? colors.destructive : colors.border, width: "100%" }]}>
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
          {!!codeError && <Text style={[styles.fieldError, { color: colors.destructive }]}>{codeError}</Text>}
          {!!globalError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={15} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{globalError}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={fetchStatus === "fetching" || code.length < 6}
            style={[styles.primaryBtn, { opacity: code.length < 6 ? 0.6 : 1, width: "100%" }]}
          >
            <LinearGradient colors={[colors.primary, colors.warmGray]} style={styles.primaryBtnGrad}>
              {fetchStatus === "fetching"
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Verify & Continue</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View nativeID="clerk-captcha" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: botPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={{ marginTop: 20, marginBottom: 32 }}>
          <LinearGradient colors={[colors.primary, colors.warmGray]} style={[styles.logoIcon, { marginBottom: 20 }]}>
            <Ionicons name="flash" size={22} color={colors.primaryForeground} />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.foreground }]}>Join Regime</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Build the body. Break the excuses.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Username</Text>
            <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: usernameError ? colors.destructive : colors.border }]}>
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
            {!!usernameError && <Text style={[styles.fieldError, { color: colors.destructive }]}>{usernameError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: emailError ? colors.destructive : colors.border }]}>
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
            {!!emailError && <Text style={[styles.fieldError, { color: colors.destructive }]}>{emailError}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Password</Text>
            <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: passwordError ? colors.destructive : colors.border }]}>
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
            {!!passwordError && <Text style={[styles.fieldError, { color: colors.destructive }]}>{passwordError}</Text>}
          </View>
        </View>

        {!!globalError && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{globalError}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSignUp}
          disabled={!email || !password || !username || fetchStatus === "fetching"}
          style={[styles.primaryBtn, { opacity: (!email || !password || !username) ? 0.6 : 1 }]}
        >
          <LinearGradient colors={[colors.primary, colors.warmGray]} style={styles.primaryBtnGrad}>
            {fetchStatus === "fetching"
              ? <ActivityIndicator color={colors.primaryForeground} />
              : <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Create Account</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or continue with</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity onPress={handleGoogle} disabled={googleLoading} style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {googleLoading
            ? <ActivityIndicator size="small" color={colors.foreground} />
            : <>
              <Ionicons name="logo-google" size={16} color={colors.foreground} />
              <Text style={[styles.googleText, { color: colors.foreground }]}>Sign up with Google</Text>
            </>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={handleApple} disabled={appleLoading} style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {appleLoading
            ? <ActivityIndicator size="small" color={colors.foreground} />
            : <>
              <Ionicons name="logo-apple" size={18} color={colors.foreground} />
              <Text style={[styles.googleText, { color: colors.foreground }]}>Sign up with Apple</Text>
            </>
          }
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
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  logoIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 34, fontFamily: "Inter_700Bold", letterSpacing: -1.1, marginBottom: 6 },
  subtitle: { fontSize: 18, fontFamily: "Inter_500Medium", marginBottom: 0, lineHeight: 26 },
  socialBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 999, borderWidth: 1, paddingVertical: 15, marginBottom: 14 },
  googleText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.2 },
  form: { gap: 16, marginBottom: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  fieldError: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 8 },
  inputField: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  eyeBtn: { padding: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  primaryBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  primaryBtnGrad: { paddingVertical: 16, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  linkRow: { flexDirection: "row", justifyContent: "center" },
  linkLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  linkText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
