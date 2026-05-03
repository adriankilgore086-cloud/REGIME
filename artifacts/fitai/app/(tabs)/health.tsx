import React, { useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function BarChart({ data, max, color }: { data: number[]; max: number; color: string }) {
  const colors = useColors();
  return (
    <View style={bcStyles.container}>
      {data.map((val, i) => {
        const pct = max > 0 ? val / max : 0;
        const date = new Date(Date.now() - (data.length - 1 - i) * 86400000);
        return (
          <View key={i} style={bcStyles.barCol}>
            <View style={[bcStyles.barTrack, { backgroundColor: colors.muted }]}>
              <LinearGradient
                colors={[color, color + "70"]}
                style={[bcStyles.barFill, { height: `${Math.max(pct * 100, 4)}%` }]}
              />
            </View>
            <Text style={[bcStyles.label, { color: colors.mutedForeground }]}>
              {DAYS_SHORT[date.getDay()]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const bcStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end", height: 100, gap: 6 },
  barCol: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  barTrack: { flex: 1, width: "100%", borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", borderRadius: 4 },
  label: { fontSize: 9, fontFamily: "Inter_500Medium" },
});

function MuscleBar({ muscle, pct, color }: { muscle: string; pct: number; color: string }) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 800, delay: 100, useNativeDriver: false }).start();
  }, []);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  return (
    <View style={mbStyles.row}>
      <Text style={[mbStyles.label, { color: colors.foreground }]}>{muscle}</Text>
      <View style={[mbStyles.track, { backgroundColor: colors.muted }]}>
        <Animated.View style={[mbStyles.fill, { width, backgroundColor: color }]} />
      </View>
      <Text style={[mbStyles.pct, { color: colors.mutedForeground }]}>{pct}%</Text>
    </View>
  );
}

const mbStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  label: { width: 80, fontSize: 12, fontFamily: "Inter_500Medium" },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3 },
  pct: { width: 32, fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "right" },
});

function RecoveryRing({ score }: { score: number }) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: score, duration: 1200, useNativeDriver: false }).start();
  }, []);

  const ringColor = score >= 75 ? colors.success : score >= 50 ? "#FFB800" : "#FF2D78";
  const label = score >= 75 ? "Excellent" : score >= 50 ? "Good" : "Low";

  return (
    <View style={rrStyles.container}>
      <View style={[rrStyles.outerRing, { borderColor: ringColor + "30" }]}>
        <View style={[rrStyles.middleRing, { borderColor: ringColor + "20" }]}>
          <View style={[rrStyles.innerCircle, { backgroundColor: ringColor + "12" }]}>
            <Text style={[rrStyles.scoreNum, { color: ringColor }]}>{score}</Text>
            <Text style={[rrStyles.scorePct, { color: ringColor + "AA" }]}>/ 100</Text>
            <Text style={[rrStyles.scoreLabel, { color: ringColor }]}>{label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const rrStyles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 8 },
  outerRing: { width: 140, height: 140, borderRadius: 70, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  middleRing: { width: 116, height: 116, borderRadius: 58, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  innerCircle: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  scoreNum: { fontSize: 32, fontFamily: "Inter_700Bold", lineHeight: 36 },
  scorePct: { fontSize: 11, fontFamily: "Inter_400Regular" },
  scoreLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 2 },
});

const READINESS_METRICS = [
  { label: "Sleep Quality", value: 78, icon: "moon-outline", color: "#7B2FBE", tip: "7.2h logged" },
  { label: "Hydration", value: 65, icon: "water-outline", color: "#00D4FF", tip: "2.1L today" },
  { label: "Muscle Recovery", value: 90, icon: "fitness-outline", color: "#00E5A0", tip: "48h since heavy session" },
  { label: "Heart Rate", value: 82, icon: "heart-outline", color: "#FF2D78", tip: "Resting 62 bpm" },
];

const RECOVERY_TIPS = [
  { icon: "cafe-outline", text: "Avoid caffeine after 2pm for better sleep recovery.", color: "#FFB800" },
  { icon: "water-outline", text: "Drink 500ml of water before your next session.", color: "#00D4FF" },
  { icon: "bed-outline", text: "8 hours of sleep will boost tomorrow's performance.", color: "#7B2FBE" },
];

export default function HealthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { healthMetrics, userStats } = useFitness();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const sorted = [...healthMetrics].sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7);
  const calorieData = last7.map((h) => h.calories);
  const minuteData = last7.map((h) => h.activeMinutes);
  const maxCal = Math.max(...calorieData, 1);
  const maxMin = Math.max(...minuteData, 1);

  const allMuscles = healthMetrics.flatMap((h) => h.muscleGroups);
  const muscleCounts: Record<string, number> = {};
  allMuscles.forEach((m) => { muscleCounts[m] = (muscleCounts[m] ?? 0) + 1; });
  const totalMuscle = allMuscles.length || 1;
  const muscleData = Object.entries(muscleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, pct: Math.round((count / totalMuscle) * 100) }));

  const MUSCLE_COLORS = ["#00D4FF", "#FF2D78", "#00E5A0", "#FFB800", "#7B2FBE", "#FF6B35"];

  const weekCalories = calorieData.reduce((a, b) => a + b, 0);
  const avgCalories = Math.round(weekCalories / Math.max(calorieData.length, 1));
  const todayMetric = healthMetrics.find((h) => h.date === new Date().toISOString().split("T")[0]);
  const recoveryScore = 82;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Health</Text>
        <View style={[styles.syncBadge, { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }]}>
          <View style={[styles.syncDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.syncText, { color: colors.success }]}>Synced</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>

        <View style={styles.statsGrid}>
          {[
            { icon: "flame-outline", label: "Calories Today", value: `${todayMetric?.calories ?? 0}`, color: "#FF2D78" },
            { icon: "heart-outline", label: "Heart Rate", value: "72 bpm", color: "#FF2D78" },
            { icon: "time-outline", label: "Active Today", value: `${todayMetric?.activeMinutes ?? 0}m`, color: colors.primary },
            { icon: "trending-up-outline", label: "Weekly Avg Cal", value: `${avgCalories}`, color: colors.success },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}>
                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.recoveryCard, { backgroundColor: colors.card, borderColor: "#00E5A030" }]}>
          <LinearGradient colors={["#00E5A010", "#00D4FF08", "transparent"]} style={StyleSheet.absoluteFill} />
          <View style={styles.recoveryTopRow}>
            <View>
              <Text style={[styles.recoveryBadge, { color: colors.success }]}>DAILY READINESS</Text>
              <Text style={[styles.recoveryTitle, { color: colors.foreground }]}>Recovery Score</Text>
              <Text style={[styles.recoveryBody, { color: colors.mutedForeground }]}>
                Your body is primed for a heavy session today.{"\n"}Optimal recovery detected.
              </Text>
            </View>
            <RecoveryRing score={recoveryScore} />
          </View>

          <View style={styles.metricsGrid}>
            {READINESS_METRICS.map((m) => (
              <View key={m.label} style={[styles.metricBox, { backgroundColor: m.color + "10", borderColor: m.color + "25" }]}>
                <View style={styles.metricTop}>
                  <Ionicons name={m.icon as any} size={14} color={m.color} />
                  <Text style={[styles.metricVal, { color: m.color }]}>{m.value}%</Text>
                </View>
                <Text style={[styles.metricLabel, { color: colors.foreground }]} numberOfLines={1}>{m.label}</Text>
                <Text style={[styles.metricTip, { color: colors.mutedForeground }]}>{m.tip}</Text>
                <View style={[styles.metricBar, { backgroundColor: m.color + "20" }]}>
                  <View style={[styles.metricFill, { width: `${m.value}%`, backgroundColor: m.color }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.tipsTitle, { color: colors.foreground }]}>AI Recovery Tips</Text>
          </View>
          {RECOVERY_TIPS.map((tip) => (
            <View key={tip.text} style={[styles.tipRow, { borderColor: colors.border }]}>
              <View style={[styles.tipIcon, { backgroundColor: tip.color + "15" }]}>
                <Ionicons name={tip.icon as any} size={14} color={tip.color} />
              </View>
              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip.text}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>Calories Burned</Text>
              <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>7-day overview</Text>
            </View>
            <View style={[styles.chartBadge, { backgroundColor: "#FF2D7820" }]}>
              <Text style={[styles.chartBadgeText, { color: "#FF2D78" }]}>{weekCalories.toLocaleString()} total</Text>
            </View>
          </View>
          <BarChart data={calorieData} max={maxCal} color="#FF2D78" />
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>Active Minutes</Text>
              <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>7-day overview</Text>
            </View>
            <View style={[styles.chartBadge, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.chartBadgeText, { color: colors.primary }]}>
                {minuteData.reduce((a, b) => a + b, 0)}m total
              </Text>
            </View>
          </View>
          <BarChart data={minuteData} max={maxMin} color={colors.primary} />
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>Muscle Groups Trained</Text>
              <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>Distribution across workouts</Text>
            </View>
          </View>
          {muscleData.length === 0 ? (
            <Text style={[styles.noData, { color: colors.mutedForeground }]}>Complete workouts to see muscle distribution</Text>
          ) : (
            muscleData.map((m, i) => (
              <MuscleBar key={m.name} muscle={m.name} pct={m.pct} color={MUSCLE_COLORS[i % MUSCLE_COLORS.length]} />
            ))
          )}
        </View>

        <View style={[styles.lifetimeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.lifetimeTitle, { color: colors.foreground }]}>Lifetime Stats</Text>
          {[
            { label: "Total Calories Burned", value: userStats.caloriesBurned.toLocaleString(), icon: "flame", color: "#FF2D78" },
            { label: "Total Training Minutes", value: userStats.totalMinutes.toLocaleString(), icon: "time", color: colors.primary },
            { label: "Workouts Completed", value: userStats.totalWorkouts.toString(), icon: "barbell", color: colors.success },
            { label: "Longest Streak", value: `${userStats.longestStreak} days`, icon: "flash", color: "#FFB800" },
          ].map((item) => (
            <View key={item.label} style={[styles.lifetimeRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.lifetimeIcon, { backgroundColor: item.color + "15" }]}>
                <Ionicons name={item.icon as any} size={14} color={item.color} />
              </View>
              <Text style={[styles.lifetimeLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.lifetimeValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  syncBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  syncDot: { width: 6, height: 6, borderRadius: 3 },
  syncText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: { width: "47%", borderRadius: 16, borderWidth: 1, padding: 14, alignItems: "flex-start", gap: 6 },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  recoveryCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 14, overflow: "hidden" },
  recoveryTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  recoveryBadge: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2, marginBottom: 4 },
  recoveryTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.4, marginBottom: 6 },
  recoveryBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, maxWidth: 160 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricBox: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 12, gap: 4 },
  metricTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  metricVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  metricLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  metricTip: { fontSize: 10, fontFamily: "Inter_400Regular" },
  metricBar: { height: 4, borderRadius: 2, overflow: "hidden", marginTop: 6 },
  metricFill: { height: "100%", borderRadius: 2 },
  tipsCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  tipsTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderTopWidth: 1 },
  tipIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  chartCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  chartHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  chartTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  chartSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  chartBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  chartBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  noData: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
  lifetimeCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  lifetimeTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  lifetimeRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  lifetimeIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  lifetimeLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  lifetimeValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
