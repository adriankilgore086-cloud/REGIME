import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Dimensions, Platform, Animated, KeyboardAvoidingView,
  ScrollView, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignIn, useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useColors } from "@/hooks/useColors";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");

function PulseRing({ size, color, delay }: { size: number; color: string; delay: number }) {
  const anim = useRef(new Animated.Value(0.7)).current;
  const useND = Platform.OS !== "web";
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: useND }),
        Animated.timing(anim, { toValue: 0.7, duration: 2000, useNativeDriver: useND }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 1.5, borderColor: color,
      position: "absolute", opacity: anim,
    }} />
  );
}

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (Platform.OS === "ios") void WebBrowser.warmUpAsync();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== "web" }),
      Animated.spring(slideAnim, { toValue: 0, tension: 38, friction: 8, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
    return () => { if (Platform.OS === "ios") void WebBrowser.coolDownAsync(); };
  }, []);

  const handleLogin = async () => {
    signIn.reset();
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          if (!url.startsWith("http")) router.replace("/(tabs)");
        },
      });
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
    } catch { /* errors shown via hook */ } finally {
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

  const emailError = errors?.fields?.identifier?.message;
  const passwordError = errors?.fields?.password?.message;
  const globalError = errors?.global?.[0]?.message;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const canLogin = !!email && !!password && fetchStatus !== "fetching";

  return (
    <View style={[styles.root, { backgroundColor: "#0D0D0D" }]}>
      {/* Ambient background glows */}
      <View style={[styles.glow, { top: -80, left: -80, width: 280, height: 280, backgroundColor: "#8FB8FF" }]} />
      <View style={[styles.glow, { top: 60, right: -100, width: 220, height: 220, backgroundColor: "#A78BFA" }]} />
      <View style={[styles.glow, { bottom: "30%", left: "10%", width: 160, height: 160, backgroundColor: "#7BE0B8" }]} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* ── LOGO HERO ── */}
            <View style={styles.heroSection}>
              {/* Concentric pulse rings */}
              <View style={styles.ringsContainer}>
                <PulseRing size={220} color="#8FB8FF20" delay={0} />
                <PulseRing size={170} color="#8FB8FF35" delay={300} />
                <PulseRing size={120} color="#8FB8FF50" delay={600} />

                {/* Logo circle */}
              <LinearGradient
                colors={["#FFFFFF", "#D8D8D8"]}
                style={styles.logoCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="flash" size={64} color="#0D0D0D" />
              </LinearGradient>
              </View>

              {/* App name + tagline */}
              <Text style={styles.appName}>Regime</Text>
              <Text style={styles.tagline}>Start your transformation today</Text>
            </View>

            {/* ── AUTH FORM ── */}
            <View style={styles.formSection}>

              {/* Google */}
              <TouchableOpacity onPress={handleGoogle} disabled={googleLoading} style={styles.socialBtn} activeOpacity={0.8}>
                {googleLoading
                  ? <ActivityIndicator size="small" color="#F5F5F5" />
                  : <>
                    <Ionicons name="logo-google" size={18} color="#F5F5F5" />
                    <Text style={styles.googleText}>Continue with Google</Text>
                  </>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={handleApple} disabled={appleLoading} style={styles.socialBtn} activeOpacity={0.8}>
                {appleLoading
                  ? <ActivityIndicator size="small" color="#F5F5F5" />
                  : <>
                    <Ionicons name="logo-apple" size={18} color="#F5F5F5" />
                    <Text style={styles.googleText}>Continue with Apple</Text>
                  </>
                }
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Sign in</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email oval */}
              <View style={[
                styles.ovalInput,
                { borderColor: emailError ? "#FF4B4B" : "#2E2E2E" },
              ]}>
                <Ionicons name="mail-outline" size={17} color="#A1A1A1" style={{ marginLeft: 18 }} />
                <TextInput
                  style={styles.ovalInputField}
                  placeholder="Email address"
                  placeholderTextColor="#555"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {!!emailError && <Text style={styles.fieldErr}>{emailError}</Text>}

              {/* Password oval */}
              <View style={[
                styles.ovalInput,
                { borderColor: passwordError ? "#FF4B4B" : "#2E2E2E", marginTop: 12 },
              ]}>
                <Ionicons name="lock-closed-outline" size={17} color="#A1A1A1" style={{ marginLeft: 18 }} />
                <TextInput
                  style={styles.ovalInputField}
                  placeholder="Password"
                  placeholderTextColor="#555"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ marginRight: 16, padding: 4 }}>
                  <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={17} color="#555" />
                </TouchableOpacity>
              </View>
              {!!passwordError && <Text style={styles.fieldErr}>{passwordError}</Text>}

              {/* Global error */}
              {!!globalError && (
                <View style={styles.globalErr}>
                  <Ionicons name="alert-circle-outline" size={14} color="#FF4B4B" />
                  <Text style={styles.globalErrText}>{globalError}</Text>
                </View>
              )}

              {/* Black login bar */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={!canLogin}
                activeOpacity={0.85}
                style={[styles.loginBar, { opacity: canLogin ? 1 : 0.45 }]}
              >
                {fetchStatus === "fetching"
                  ? <ActivityIndicator color="#F5F5F5" />
                  : <Text style={styles.loginBarText}>Login</Text>
                }
              </TouchableOpacity>

              <View style={styles.signupRow}>
                <Link href="/(auth)/sign-up" asChild>
                  <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.signupLink}>Create account</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glow: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.07,
  },
  scroll: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 28 },

  /* Hero section — takes most of the screen */
  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingBottom: 32,
    minHeight: 340,
  },
  ringsContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  logoCircle: {
    width: 132,
    height: 132,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
  },
  appName: {
    fontSize: 44,
    fontFamily: "Poppins_700Bold",
    color: "#F5F5F5",
    letterSpacing: -1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    color: "#A1A1A1",
    textAlign: "center",
    lineHeight: 25,
  },

  /* Form section */
  formSection: {
    paddingBottom: 12,
  },

  /* Google button */
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#171717",
    paddingVertical: 15,
    marginBottom: 14,
  },
  googleText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#F5F5F5",
  },

  /* Divider */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#2E2E2E",
  },
  dividerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#555",
  },

  /* Oval inputs */
  ovalInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 100,
    borderWidth: 1,
    backgroundColor: "#111111",
    minHeight: 74,
    overflow: "hidden",
  },
  ovalInputField: {
    flex: 1,
    fontSize: 21,
    fontFamily: "Inter_500Medium",
    color: "#F5F5F5",
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
    height: "100%",
  },
  fieldErr: {
    fontSize: 11,
    color: "#FF4B4B",
    fontFamily: "Inter_400Regular",
    marginTop: 5,
    marginLeft: 18,
  },
  globalErr: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginLeft: 4,
  },
  globalErrText: {
    fontSize: 12,
    color: "#FF4B4B",
    fontFamily: "Inter_400Regular",
    flex: 1,
  },

  /* Black login bar */
  loginBar: {
    borderRadius: 100,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#2E2E2E",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  loginBarText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#F5F5F5",
    letterSpacing: 0.5,
  },

  /* Sign up link */
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  signupLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#F5F5F5",
  },
});
