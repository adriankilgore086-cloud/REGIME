import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

function RecoveryRing({ score }: { score: number }) {
  const colors = useColors();
  const ringColor = score >= 75 ? colors.success : score >= 50 ? "#F3D27A" : "#FF2D78";
  const label = score >= 75 ? "Excellent" : score >= 50 ? "Good" : "Low";

  return (
    <View style={rrStyles.container}>
      <View style={[rrStyles.ring, { borderColor: ringColor, borderWidth: 3 }]}>
        <Text style={[rrStyles.score, { color: ringColor }]}>{score}%</Text>
      </View>
      <Text style={[rrStyles.label, { color: ringColor }]}>{label}</Text>
    </View>
  );
}

const rrStyles = StyleSheet.create({
  container: { alignItems: "center", gap: 6 },
  ring: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center" },
  score: { fontSize: 22, fontFamily: "Inter_700Bold" },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 2 },
});

export default function RecoveryDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const recoveryScore = 82;

  const READINESS_METRICS = [
    { label: "Sleep Quality", value: 78, icon: "moon-outline", color: "#A78BFA", tip: "7.2h logged" },
    { label: "Hydration", value: 65, icon: "water-outline", color: "#8FB8FF", tip: "2.1L today" },
    { label: "Muscle Recovery", value: 90, icon: "fitness-outline", color: "#7BE0B8", tip: "48h since heavy session" },
    { label: "Heart Rate", value: 82, icon: "heart-outline", color: "#FF2D78", tip: "Resting 62 bpm" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 12, paddingBottom: 100 }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>Recovery Score</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={["#7BE0B810", "#8FB8FF08", "transparent"]} style={StyleSheet.absoluteFill} />
            <View style={styles.scoreTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scoreBadge, { color: colors.success }]}>DAILY READINESS</Text>
                <Text style={[styles.scoreTitle, { color: colors.foreground }]}>Recovery Status</Text>
                <Text style={[styles.scoreBody, { color: colors.mutedForeground }]}>
                  Your body is primed for a heavy session today.{"\n"}Optimal recovery detected.
                </Text>
              </View>
              <RecoveryRing score={recoveryScore} />
            </View>
          </View>

          <View style={[styles.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.metricsTitle, { color: colors.foreground }]}>Recovery Metrics</Text>
            <View style={styles.metricsList}>
              {READINESS_METRICS.map((m, i) => (
                <View
                  key={m.label}
                  style={[
                    styles.metricItem,
                    i < READINESS_METRICS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={[styles.metricIcon, { backgroundColor: m.color + "18" }]}>
                    <Ionicons name={m.icon as any} size={18} color={m.color} />
                  </View>
                  <View style={styles.metricInfo}>
                    <Text style={[styles.metricLabel, { color: colors.foreground }]}>{m.label}</Text>
                    <Text style={[styles.metricTip, { color: colors.mutedForeground }]}>{m.tip}</Text>
                  </View>
                  <View style={styles.metricRight}>
                    <Text style={[styles.metricVal, { color: m.color }]}>{m.value}%</Text>
                    <View style={[styles.metricTrack, { backgroundColor: m.color + "20" }]}>
                      <View style={[styles.metricFill, { width: `${m.value}%`, backgroundColor: m.color }]} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.tipsCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={[styles.tipsText, { color: colors.foreground, flex: 1 }]}>
                Focus on sleep quality and hydration to maximize your recovery score tomorrow.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {},
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: "Poppins_700Bold", letterSpacing: -0.5 },
  content: { paddingHorizontal: 20 },
  scoreCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 14 },
  scoreTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  scoreBadge: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2, marginBottom: 4 },
  scoreTitle: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: -0.4, marginBottom: 6 },
  scoreBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  metricsCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
  metricsTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  metricsList: {},
  metricItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricInfo: { flex: 1 },
  metricLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  metricTip: { fontSize: 11, fontFamily: "Inter_400Regular" },
  metricRight: { alignItems: "flex-end", gap: 6 },
  metricVal: { fontSize: 12, fontFamily: "Inter_700Bold" },
  metricTrack: { width: 40, height: 4, borderRadius: 2, overflow: "hidden" },
  metricFill: { height: "100%", borderRadius: 2 },
  tipsCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  tipsText: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 18 },
});
