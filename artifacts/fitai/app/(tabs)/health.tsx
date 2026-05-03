import React from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform,
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
                colors={[color, color + "80"]}
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
  return (
    <View style={mbStyles.row}>
      <Text style={[mbStyles.label, { color: colors.foreground }]}>{muscle}</Text>
      <View style={[mbStyles.track, { backgroundColor: colors.muted }]}>
        <LinearGradient
          colors={[color, color + "60"]}
          style={[mbStyles.fill, { width: `${pct}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
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
            { icon: "flame-outline", label: "Calories Today", value: `${todayMetric?.calories ?? 0}`, color: colors.accent },
            { icon: "heart-outline", label: "Avg Heart Rate", value: "72 bpm", color: "#FF2D78" },
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

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>Calories Burned</Text>
            <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>7-day overview</Text>
          </View>
          <BarChart data={calorieData} max={maxCal} color={colors.accent} />
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>Active Minutes</Text>
            <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>7-day overview</Text>
          </View>
          <BarChart data={minuteData} max={maxMin} color={colors.primary} />
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>Muscle Groups Trained</Text>
            <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>Distribution across workouts</Text>
          </View>
          {muscleData.length === 0 ? (
            <Text style={[styles.noData, { color: colors.mutedForeground }]}>Complete workouts to see muscle distribution</Text>
          ) : (
            muscleData.map((m, i) => (
              <MuscleBar key={m.name} muscle={m.name} pct={m.pct} color={MUSCLE_COLORS[i % MUSCLE_COLORS.length]} />
            ))
          )}
        </View>

        <View style={[styles.recoveryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient colors={["#00E5A015", "transparent"]} style={StyleSheet.absoluteFill} />
          <View style={styles.recoveryHeader}>
            <Ionicons name="battery-charging-outline" size={20} color={colors.success} />
            <Text style={[styles.recoveryTitle, { color: colors.foreground }]}>Recovery Score</Text>
            <Text style={[styles.recoveryValue, { color: colors.success }]}>82%</Text>
          </View>
          <Text style={[styles.recoverySub, { color: colors.mutedForeground }]}>
            Your body is well-rested. Optimal conditions for a heavy session today.
          </Text>
          <View style={styles.recoveryBars}>
            {[
              { label: "Sleep", value: 78, color: colors.purple },
              { label: "Hydration", value: 65, color: colors.primary },
              { label: "Muscle", value: 90, color: colors.success },
            ].map((rb) => (
              <View key={rb.label} style={styles.recoveryBar}>
                <Text style={[styles.rbLabel, { color: colors.mutedForeground }]}>{rb.label}</Text>
                <View style={[styles.rbTrack, { backgroundColor: colors.muted }]}>
                  <View style={[styles.rbFill, { width: `${rb.value}%`, backgroundColor: rb.color }]} />
                </View>
                <Text style={[styles.rbValue, { color: rb.color }]}>{rb.value}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.lifetimeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.lifetimeTitle, { color: colors.foreground }]}>Lifetime Stats</Text>
          {[
            { label: "Total Calories Burned", value: userStats.caloriesBurned.toLocaleString(), icon: "flame" },
            { label: "Total Training Minutes", value: userStats.totalMinutes.toLocaleString(), icon: "time" },
            { label: "Workouts Completed", value: userStats.totalWorkouts.toString(), icon: "barbell" },
            { label: "Longest Streak", value: `${userStats.longestStreak} days`, icon: "flash" },
          ].map((item) => (
            <View key={item.label} style={[styles.lifetimeRow, { borderBottomColor: colors.border }]}>
              <Ionicons name={item.icon as any} size={16} color={colors.primary} />
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
  chartCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  chartHeader: { marginBottom: 16 },
  chartTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  chartSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  noData: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
  recoveryCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14, overflow: "hidden" },
  recoveryHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  recoveryTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold" },
  recoveryValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  recoverySub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14, lineHeight: 18 },
  recoveryBars: { gap: 10 },
  recoveryBar: { flexDirection: "row", alignItems: "center", gap: 10 },
  rbLabel: { width: 65, fontSize: 12, fontFamily: "Inter_500Medium" },
  rbTrack: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  rbFill: { height: "100%", borderRadius: 3 },
  rbValue: { width: 32, fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  lifetimeCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  lifetimeTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  lifetimeRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  lifetimeLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  lifetimeValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
