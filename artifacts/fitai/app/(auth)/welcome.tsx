import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");

const FEATURES = [
  { icon: "flash", text: "AI-Powered Coaching" },
  { icon: "trophy", text: "XP & Achievements" },
  { icon: "heart", text: "Health Analytics" },
  { icon: "people", text: "Friend Challenges" },
];

function FloatingOrb({ x, y, size, color, delay }: { x: number; y: number; size: number; color: string; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const useND = Platform.OS !== "web";
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 3000 + delay, useNativeDriver: useND }),
        Animated.timing(anim, { toValue: 0, duration: 3000 + delay, useNativeDriver: useND }),
      ])
    ).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

  return (
    <Animated.View style={{
      position: "absolute", left: x, top: y,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color,
      opacity: 0.12,
      transform: [{ translateY }],
    }} />
  );
}

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(Platform.OS === "web" ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(Platform.OS === "web" ? 0 : 40)).current;

  useEffect(() => {
    if (Platform.OS === "web") return;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 40, friction: 7 }),
    ]).start();
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FloatingOrb x={-60} y={80} size={200} color={colors.primary} delay={0} />
      <FloatingOrb x={width - 120} y={200} size={180} color={colors.accent} delay={500} />
      <FloatingOrb x={20} y={height * 0.6} size={150} color={colors.purple} delay={1000} />

      <LinearGradient
        colors={["transparent", colors.background + "CC", colors.background]}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.6, 1]}
      />

      <Animated.View style={[styles.content, { paddingTop: topPad + 20, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.logoRow}>
          <LinearGradient colors={["#8FB8FF", "#6B9EFF"]} style={styles.logoIcon}>
            <Ionicons name="flash" size={28} color="#0D0D0D" />
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.foreground }]}>FitAI</Text>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            Your AI-Powered{"\n"}
            <Text style={{ color: colors.primary }}>Fitness Journey</Text>
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Train smarter. Level up faster. Achieve more.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={[styles.featureRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name={f.icon as any} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            </View>
          ))}
        </View>

        <View style={[styles.cta, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 12 }]}>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/sign-up")}
            activeOpacity={0.85}
            style={styles.primaryBtn}
          >
            <LinearGradient colors={["#8FB8FF", "#6B9EFF"]} style={styles.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.primaryBtnText}>Get Started Free</Text>
              <Ionicons name="arrow-forward" size={18} color="#0D0D0D" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/sign-in")}
            activeOpacity={0.85}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 40 },
  logoIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  appName: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  hero: { marginBottom: 36 },
  headline: { fontSize: 42, fontFamily: "Inter_700Bold", lineHeight: 50, letterSpacing: -1.5, marginBottom: 12 },
  tagline: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24 },
  features: { gap: 10, marginBottom: 40 },
  featureRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  featureIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  cta: { gap: 12, marginTop: "auto" },
  primaryBtn: { borderRadius: 18, overflow: "hidden" },
  primaryBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  primaryBtnText: { color: "#0D0D0D", fontSize: 16, fontFamily: "Inter_700Bold" },
  secondaryBtn: { borderRadius: 18, borderWidth: 1, paddingVertical: 15, alignItems: "center" },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
