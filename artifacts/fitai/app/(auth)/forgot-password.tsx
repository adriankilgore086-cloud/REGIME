import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSignIn } from "@clerk/expo";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

type Step = "email" | "code" | "done";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, fetchStatus } = useSignIn();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [passError, setPassError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSendCode = async () => {
    setError(""); setEmailError("");
    if (!email.trim()) { setEmailError("Email is required"); return; }
    try {
      await (signIn as any).create({ strategy: "reset_password_email_code", identifier: email.trim() });
      setStep("code");
    } catch (e: any) {
      const msg = e?.errors?.[0]?.message ?? e?.message ?? "Could not find an account with that email.";
      setEmailError(msg);
    }
  };

  const handleResetPassword = async () => {
    setError(""); setCodeError(""); setPassError("");
    if (!code.trim()) { setCodeError("Enter the 6-digit code"); return; }
    if (newPassword.length < 8) { setPassError("Password must be at least 8 characters"); return; }
    try {
      const result = await (signIn as any).attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: newPassword,
      });
      if ((result as any).status === "complete") {
        setStep("done");
      }
    } catch (e: any) {
      const msg = e?.errors?.[0]?.message ?? e?.message ?? "Invalid code. Please try again.";
      if (msg.toLowerCase().includes("password")) setPassError(msg);
      else setCodeError(msg);
    }
  };

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
        <TouchableOpacity onPress={() => router.replace("/(auth)/sign-in" as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={[styles.logoRow, { marginTop: 20 }]}>
          <LinearGradient colors={["#FFFFFF", "#E0E0E0"]} style={styles.logoIcon}>
            <Ionicons name="flash" size={22} color="#0D0D0D" />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.foreground }]}>Regime</Text>
        </View>

        {step === "done" ? (
          <View style={styles.doneWrap}>
            <View style={[styles.doneIcon, { backgroundColor: colors.success + "20" }]}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
            </View>
            <Text style={[styles.title, { color: colors.foreground, textAlign: "center" }]}>Password Reset!</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, textAlign: "center" }]}>
              Your password has been updated successfully. You can now sign in with your new password.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/sign-in" as any)}
              style={[styles.primaryBtn, { marginTop: 8 }]}
            >
              <LinearGradient colors={["#FFFFFF", "#E8E8E8"]} style={styles.primaryBtnGrad}>
                <Text style={styles.primaryBtnText}>Back to Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : step === "email" ? (
          <>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
              <Ionicons name="key-outline" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Manage Account</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Enter your email address and we'll send you a code to reset your password.
            </Text>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email Address</Text>
              <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: emailError ? "#FF4B4B" : colors.border }]}>
                <Ionicons name="mail-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputField, { color: colors.foreground }]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setEmailError(""); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                />
              </View>
              {!!emailError && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color="#FF4B4B" />
                  <Text style={styles.fieldError}>{emailError}</Text>
                </View>
              )}
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#FF4B4B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSendCode}
              disabled={!email.trim() || fetchStatus === "fetching"}
              style={[styles.primaryBtn, { opacity: !email.trim() ? 0.6 : 1 }]}
            >
              <LinearGradient colors={["#FFFFFF", "#E8E8E8"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {fetchStatus === "fetching"
                  ? <ActivityIndicator color="#0D0D0D" />
                  : <>
                    <Ionicons name="paper-plane-outline" size={16} color="#0D0D0D" />
                    <Text style={styles.primaryBtnText}>Send Reset Code</Text>
                  </>
                }
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.linkRow}>
              <Text style={[styles.linkLabel, { color: colors.mutedForeground }]}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={[styles.linkText, { color: colors.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.headerIcon, { backgroundColor: "#A78BFA15", borderColor: "#A78BFA30" }]}>
              <Ionicons name="shield-checkmark-outline" size={28} color="#A78BFA" />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Check your email</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              We sent a 6-digit code to{"\n"}
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>{email}</Text>
            </Text>

            <View style={[styles.field, { marginBottom: 12 }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Reset Code</Text>
              <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: codeError ? "#FF4B4B" : colors.border }]}>
                <Ionicons name="key-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputField, { color: colors.foreground, letterSpacing: 4, fontSize: 18 }]}
                  placeholder="000000"
                  placeholderTextColor={colors.mutedForeground}
                  value={code}
                  onChangeText={(t) => { setCode(t); setCodeError(""); }}
                  keyboardType="numeric"
                  maxLength={6}
                  autoFocus
                />
              </View>
              {!!codeError && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color="#FF4B4B" />
                  <Text style={styles.fieldError}>{codeError}</Text>
                </View>
              )}
            </View>

            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>New Password</Text>
              <View style={[styles.inputWrap, { backgroundColor: "transparent", borderColor: passError ? "#FF4B4B" : colors.border }]}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputField, { color: colors.foreground }]}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={colors.mutedForeground}
                  value={newPassword}
                  onChangeText={(t) => { setNewPassword(t); setPassError(""); }}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              {!!passError && (
                <View style={styles.fieldErrorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color="#FF4B4B" />
                  <Text style={styles.fieldError}>{passError}</Text>
                </View>
              )}
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={15} color="#FF4B4B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={!code.trim() || newPassword.length < 8 || fetchStatus === "fetching"}
              style={[styles.primaryBtn, { opacity: (!code.trim() || newPassword.length < 8) ? 0.6 : 1 }]}
            >
              <LinearGradient colors={["#FFFFFF", "#E8E8E8"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {fetchStatus === "fetching"
                  ? <ActivityIndicator color="#0D0D0D" />
                  : <>
                    <Ionicons name="lock-open-outline" size={16} color="#0D0D0D" />
                    <Text style={styles.primaryBtnText}>Reset Password</Text>
                  </>
                }
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep("email"); setCode(""); setCodeError(""); }} style={styles.backLink}>
              <Ionicons name="arrow-back" size={14} color={colors.mutedForeground} />
              <Text style={[styles.linkLabel, { color: colors.mutedForeground }]}>Use a different email</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSendCode} style={styles.backLink}>
              <Ionicons name="refresh-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.linkLabel, { color: colors.mutedForeground }]}>Resend code</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 28 },
  logoIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 20 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.8, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22, marginBottom: 28 },
  field: { gap: 6, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  fieldErrorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  fieldError: { fontSize: 12, color: "#FF4B4B", fontFamily: "Inter_400Regular" },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 8 },
  inputField: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  eyeBtn: { padding: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  errorText: { fontSize: 13, color: "#FF4B4B", fontFamily: "Inter_400Regular", flex: 1 },
  primaryBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  primaryBtnGrad: { paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryBtnText: { color: "#0D0D0D", fontSize: 16, fontFamily: "Inter_700Bold" },
  linkRow: { flexDirection: "row", justifyContent: "center" },
  linkLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  linkText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  backLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  doneWrap: { alignItems: "center", gap: 16, paddingTop: 20 },
  doneIcon: { width: 100, height: 100, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 8 },
});
