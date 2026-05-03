import React, { useRef, useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Animated, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";

const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#FF2D78", Back: "#8FB8FF", Legs: "#7BE0B8",
  Shoulders: "#F3D27A", Arms: "#A78BFA", Core: "#FF6B35",
  Glutes: "#FFB800", Cardio: "#00D4FF",
};

const RECOVERY_TIPS: Record<string, string[]> = {
  Chest: ["Allow 48h before training chest again.", "Prioritize upper chest with incline work.", "Stretch pec minor to reduce tightness."],
  Back: ["Pull-aparts and face pulls aid recovery.", "Focus on thoracic mobility between sessions.", "Avoid heavy rows if lower back is fatigued."],
  Legs: ["Foam roll quads and hamstrings daily.", "Cold therapy reduces quad DOMS.", "Light cycling aids blood flow recovery."],
  Shoulders: ["Avoid overhead pressing if impingement persists.", "Band pull-aparts improve rotator cuff health.", "Sleep with arms below shoulder height."],
  Arms: ["Arms recover faster — 36h is usually sufficient.", "Keep protein high to support growth.", "Light curls on rest days maintain pump without fatigue."],
  Core: ["Core recovers in 24h for most people.", "Avoid heavy spinal flexion if lower back is sore.", "Planks and carries are safer than crunches when fatigued."],
};

function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 900, useNativeDriver: false }).start();
  }, []);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  return (
    <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "#222", overflow: "hidden" }}>
      <Animated.View style={{ height: "100%", borderRadius: 3, backgroundColor: color, width }} />
    </View>
  );
}

function HeatmapCompact({ healthMetrics }: { healthMetrics: any[] }) {
  const colors = useColors();
  const weeks = 10;
  const totalDays = weeks * 7;
  const today = new Date();
  const cells = useMemo(() => {
    const arr: { date: string; intensity: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const metric = healthMetrics.find((h: any) => h.date === iso);
      arr.push({ date: iso, intensity: metric ? Math.min(metric.activeMinutes / 60, 1) : 0 });
    }
    return arr;
  }, [healthMetrics]);
  const byWeek: typeof cells[] = [];
  for (let w = 0; w < weeks; w++) byWeek.push(cells.slice(w * 7, w * 7 + 7));
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {byWeek.map((week, wi) => (
        <View key={wi} style={{ gap: 2 }}>
          {week.map((cell) => (
            <View key={cell.date} style={{
              width: 10, height: 10, borderRadius: 2,
              backgroundColor: cell.intensity > 0
                ? `rgba(123,224,184,${Math.max(0.25, cell.intensity)})`
                : colors.muted,
            }} />
          ))}
        </View>
      ))}
    </View>
  );
}

interface MuscleDetail {
  name: string; count: number; lastDate: string | null; pct: number; color: string;
}

function getRecoveryStatus(lastDate: string | null): { label: string; color: string } {
  if (!lastDate) return { label: "Fresh", color: "#7BE0B8" };
  const days = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
  if (days === 0) return { label: "Fatigued", color: "#FF2D78" };
  if (days === 1) return { label: "Recovering", color: "#F3D27A" };
  return { label: "Fresh", color: "#7BE0B8" };
}

export default function BodyMetricsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile, healthMetrics, userStats } = useFitness();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleDetail | null>(null);

  const bmi = userProfile.height > 0
    ? userProfile.weight / Math.pow(userProfile.height / 100, 2) : 0;
  const bmiDisplay = bmi > 0 ? bmi.toFixed(1) : "—";
  const bmiLabel = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : bmi < 30 ? "Overweight" : "Obese";
  const bmiColor = bmi < 18.5 ? "#8FB8FF" : bmi < 25 ? "#7BE0B8" : bmi < 30 ? "#F3D27A" : "#FF2D78";
  const tdee = userProfile.height > 0
    ? Math.round((10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age + 5) * 1.55) : 0;

  const allMuscles = healthMetrics.flatMap((h) => h.muscleGroups);
  const muscleCounts: Record<string, number> = {};
  const muscleLastDate: Record<string, string> = {};
  healthMetrics.forEach((h) => {
    h.muscleGroups.forEach((m: string) => {
      muscleCounts[m] = (muscleCounts[m] ?? 0) + 1;
      if (!muscleLastDate[m] || h.date > muscleLastDate[m]) muscleLastDate[m] = h.date;
    });
  });
  const total = allMuscles.length || 1;
  const muscleData: MuscleDetail[] = Object.entries(muscleCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, count]) => ({
      name, count, lastDate: muscleLastDate[name] ?? null,
      pct: Math.round((count / total) * 100),
      color: MUSCLE_COLORS[name] ?? "#8FB8FF",
    }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Body Composition</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false} scrollEventThrottle={16} removeClippedSubviews={Platform.OS !== "web"}>

        <View style={styles.metricGrid}>
          {[
            { label: "Weight", value: `${userProfile.weight}`, unit: "kg", icon: "body-outline", color: "#A78BFA" },
            { label: "Height", value: `${userProfile.height}`, unit: "cm", icon: "resize-outline", color: "#8FB8FF" },
            { label: "BMI", value: bmiDisplay, unit: bmiLabel, icon: "analytics-outline", color: bmiColor },
            { label: "Est. TDEE", value: tdee > 0 ? tdee.toLocaleString() : "—", unit: "kcal/day", icon: "flame-outline", color: "#FF2D78" },
          ].map((item) => (
            <View key={item.label} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={[item.color + "14", "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={[styles.metricIcon, { backgroundColor: item.color + "20" }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{item.value}</Text>
              <Text style={[styles.metricUnit, { color: item.color }]}>{item.unit}</Text>
              <Text style={[styles.metricLabel2, { color: colors.mutedForeground }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="fitness-outline" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Muscle Groups Trained</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Tap for detail</Text>
          </View>
          {muscleData.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Complete workouts to see muscle distribution</Text>
          ) : muscleData.map((m) => {
            const recovery = getRecoveryStatus(m.lastDate);
            return (
              <TouchableOpacity key={m.name} onPress={() => setSelectedMuscle(m)} activeOpacity={0.75} style={styles.muscleRow}>
                <View style={[styles.muscleDot, { backgroundColor: m.color }]} />
                <Text style={[styles.muscleName, { color: colors.foreground }]}>{m.name}</Text>
                <AnimatedBar pct={m.pct} color={m.color} />
                <Text style={[styles.musclePct, { color: colors.mutedForeground }]}>{m.pct}%</Text>
                <View style={[styles.pill, { backgroundColor: recovery.color + "20" }]}>
                  <Text style={[styles.pillText, { color: recovery.color }]}>{recovery.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Activity Heatmap</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>10 weeks</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEventThrottle={16}>
            <HeatmapCompact healthMetrics={healthMetrics} />
          </ScrollView>
          <View style={styles.heatLegend}>
            <Text style={[styles.heatLegendText, { color: colors.mutedForeground }]}>Less</Text>
            {[0.15, 0.35, 0.55, 0.75, 1].map((op) => (
              <View key={op} style={[styles.heatCell, { backgroundColor: `rgba(123,224,184,${op})` }]} />
            ))}
            <Text style={[styles.heatLegendText, { color: colors.mutedForeground }]}>More</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart-outline" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Lifetime Stats</Text>
          </View>
          {[
            { label: "Total Workouts", value: userStats.totalWorkouts.toString(), color: "#7BE0B8" },
            { label: "Calories Burned", value: userStats.caloriesBurned.toLocaleString(), color: "#FF2D78" },
            { label: "Active Minutes", value: userStats.totalMinutes.toLocaleString(), color: "#8FB8FF" },
            { label: "Longest Streak", value: `${userStats.longestStreak} days`, color: "#F3D27A" },
          ].map((item, i, arr) => (
            <View key={item.label} style={[styles.statRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      <Modal visible={!!selectedMuscle} transparent animationType="slide" onRequestClose={() => setSelectedMuscle(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSelectedMuscle(null)}>
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            {selectedMuscle && (() => {
              const recovery = getRecoveryStatus(selectedMuscle.lastDate);
              const tips = RECOVERY_TIPS[selectedMuscle.name] ?? [
                "Allow adequate rest before training this muscle again.",
                "Ensure proper protein intake for muscle repair.",
                "Light mobility work aids recovery.",
              ];
              return (
                <>
                  <View style={styles.sheetHandle} />
                  <View style={styles.sheetHeader}>
                    <View style={[styles.sheetIcon, { backgroundColor: selectedMuscle.color + "20" }]}>
                      <Ionicons name="fitness-outline" size={22} color={selectedMuscle.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{selectedMuscle.name}</Text>
                      <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                        {selectedMuscle.count} sessions · {selectedMuscle.pct}% of volume
                      </Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: recovery.color + "20" }]}>
                      <Text style={[styles.pillText, { color: recovery.color }]}>{recovery.label}</Text>
                    </View>
                  </View>

                  <View style={[styles.infoRow, { borderColor: colors.border }]}>
                    {[
                      { label: "Last Trained", value: selectedMuscle.lastDate ? new Date(selectedMuscle.lastDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never" },
                      { label: "Sessions", value: String(selectedMuscle.count) },
                      { label: "Volume %", value: `${selectedMuscle.pct}%` },
                    ].map((info, i) => (
                      <React.Fragment key={info.label}>
                        {i > 0 && <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />}
                        <View style={styles.infoItem}>
                          <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{info.label}</Text>
                          <Text style={[styles.infoValue, { color: i === 2 ? selectedMuscle.color : colors.foreground }]}>{info.value}</Text>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>

                  <Text style={[styles.tipsSectionLabel, { color: colors.mutedForeground }]}>AI RECOVERY TIPS</Text>
                  {tips.map((tip, i) => (
                    <View key={i} style={styles.tipRow}>
                      <View style={[styles.tipDot, { backgroundColor: selectedMuscle.color }]} />
                      <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
                    </View>
                  ))}
                </>
              );
            })()}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  content: { paddingHorizontal: 20 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  metricCard: { width: "48.5%", borderRadius: 18, borderWidth: 1, padding: 14, overflow: "hidden", gap: 4 },
  metricIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  metricValue: { fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 28 },
  metricUnit: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  metricLabel2: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  cardSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 16 },
  muscleRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#ffffff10" },
  muscleDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  muscleName: { width: 72, fontSize: 12, fontFamily: "Inter_500Medium" },
  musclePct: { width: 28, fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "right" },
  pill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  heatLegend: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10, justifyContent: "flex-end" },
  heatCell: { width: 10, height: 10, borderRadius: 2 },
  heatLegendText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  statLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#444", alignSelf: "center", marginBottom: 20 },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  sheetIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sheetSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  infoRow: { flexDirection: "row", borderWidth: 1, borderRadius: 14, marginBottom: 20, overflow: "hidden" },
  infoItem: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  infoDivider: { width: 1 },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  tipsSectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 12 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5, flexShrink: 0 },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
