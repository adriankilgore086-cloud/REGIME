import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform, Animated, TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { AIChatModal } from "@/components/AIChatModal";
import { Image } from "react-native";

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
    Animated.timing(anim, { toValue: pct, duration: 800, useNativeDriver: false }).start();
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
  const ringColor = score >= 75 ? colors.success : score >= 50 ? "#F3D27A" : "#FF2D78";
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
  { label: "Sleep Quality", value: 78, icon: "moon-outline", color: "#A78BFA", tip: "7.2h logged" },
  { label: "Hydration", value: 65, icon: "water-outline", color: "#8FB8FF", tip: "2.1L today" },
  { label: "Muscle Recovery", value: 90, icon: "fitness-outline", color: "#7BE0B8", tip: "48h since heavy session" },
  { label: "Heart Rate", value: 82, icon: "heart-outline", color: "#FF2D78", tip: "Resting 62 bpm" },
];

const HEALTH_WIDGETS = [
  { label: "403", sub: "kcal", title: "Today's Burn", icon: "flame-outline", color: "#FF6B6B" },
  { label: "62", sub: "bpm", title: "Resting HR", icon: "pulse-outline", color: "#FF7A7A" },
  { label: "7.5", sub: "hrs", title: "Sleep", icon: "moon-outline", color: "#8FB8FF" },
  { label: "2.4", sub: "L", title: "Hydration", icon: "water-outline", color: "#7BE0B8" },
];

const RECOVERY_TIPS = [
  { icon: "cafe-outline", text: "Avoid caffeine after 2pm for better sleep recovery.", color: "#F3D27A" },
  { icon: "water-outline", text: "Drink 500ml of water before your next session.", color: "#8FB8FF" },
  { icon: "bed-outline", text: "8 hours of sleep will boost tomorrow's performance.", color: "#A78BFA" },
];

function ActivityHeatmap() {
  const colors = useColors();
  const { healthMetrics } = useFitness();

  const workoutDates = useMemo(() => {
    const set = new Set<string>();
    healthMetrics.forEach((h) => { if (h.activeMinutes > 0) set.add(h.date); });
    return set;
  }, [healthMetrics]);

  const today = new Date();
  const weeks = 15;
  const totalDays = weeks * 7;

  const cells = useMemo(() => {
    const arr: { date: string; active: boolean; intensity: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const metric = healthMetrics.find((h) => h.date === iso);
      const intensity = metric ? Math.min(metric.activeMinutes / 60, 1) : 0;
      arr.push({ date: iso, active: workoutDates.has(iso), intensity });
    }
    return arr;
  }, [workoutDates, healthMetrics]);

  const byWeek: typeof cells[] = [];
  for (let w = 0; w < weeks; w++) {
    byWeek.push(cells.slice(w * 7, w * 7 + 7));
  }

  const activeCount = cells.filter((c) => c.active).length;

  return (
    <View style={[hmStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={hmStyles.header}>
        <View>
          <Text style={[hmStyles.title, { color: colors.foreground }]}>Activity Heatmap</Text>
          <Text style={[hmStyles.sub, { color: colors.mutedForeground }]}>{activeCount} active days · last {weeks} weeks</Text>
        </View>
        <View style={[hmStyles.badge, { backgroundColor: colors.success + "20" }]}>
          <View style={[hmStyles.dot, { backgroundColor: colors.success }]} />
          <Text style={[hmStyles.badgeText, { color: colors.success }]}>Active</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={hmStyles.grid}>
          {byWeek.map((week, wi) => (
            <View key={wi} style={hmStyles.col}>
              {week.map((cell, di) => {
                const opacity = cell.active ? 0.3 + cell.intensity * 0.7 : 0;
                return (
                  <View
                    key={cell.date}
                    style={[
                      hmStyles.cell,
                      {
                        backgroundColor: cell.active
                          ? `rgba(123, 224, 184, ${Math.max(opacity, 0.25)})`
                          : colors.muted,
                        borderColor: cell.active ? `rgba(123, 224, 184, 0.15)` : "transparent",
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={hmStyles.legend}>
        <Text style={[hmStyles.legendText, { color: colors.mutedForeground }]}>Less</Text>
        {[0.1, 0.3, 0.5, 0.75, 1].map((op) => (
          <View
            key={op}
            style={[hmStyles.legendCell, { backgroundColor: `rgba(123, 224, 184, ${op})` }]}
          />
        ))}
        <Text style={[hmStyles.legendText, { color: colors.mutedForeground }]}>More</Text>
      </View>
    </View>
  );
}

const hmStyles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  title: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  grid: { flexDirection: "row", gap: 3 },
  col: { gap: 3 },
  cell: { width: 12, height: 12, borderRadius: 3, borderWidth: 1 },
  legend: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 12, justifyContent: "flex-end" },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 10, fontFamily: "Inter_400Regular" },
});

export default function HealthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { healthMetrics, userStats, userProfile } = useFitness();
  const [showAICoach, setShowAICoach] = useState(false);
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

  const MUSCLE_COLORS = ["#8FB8FF", "#FF2D78", "#7BE0B8", "#F3D27A", "#A78BFA", "#FF6B35"];

  const weekCalories = calorieData.reduce((a, b) => a + b, 0);
  const avgCalories = Math.round(weekCalories / Math.max(calorieData.length, 1));
  const todayMetric = healthMetrics.find((h) => h.date === new Date().toISOString().split("T")[0]);
  const recoveryScore = 82;

  const TOP_STATS = [
    { icon: "flame-outline", label: "Calories Today", value: `${todayMetric?.calories ?? 0} kcal`, color: "#FF2D78" },
    { icon: "heart-outline", label: "Heart Rate", value: "72 bpm", color: "#FF2D78" },
    { icon: "time-outline", label: "Active Today", value: `${todayMetric?.activeMinutes ?? 0} min`, color: colors.primary },
    { icon: "trending-up-outline", label: "Weekly Avg Calories", value: `${avgCalories} kcal`, color: colors.success },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Health</Text>

        <View style={styles.headerRight}>
          <View style={[styles.syncBadge, { backgroundColor: colors.success + "20", borderColor: colors.success + "40" }]}>
            <View style={[styles.syncDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.syncText, { color: colors.success }]}>Synced</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowAICoach(true)}
            style={[styles.coachBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={[colors.primary + "22", colors.primary + "08"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="mic" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.recoveryCard, { backgroundColor: "#10241D", borderColor: "#2F6F5A" }]}>
          <View style={styles.recoveryTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recoveryBadge, { color: "#7BE0B8" }]}>RECOVERY SCORE</Text>
              <Text style={[styles.recoveryTitle, { color: "#F5F5F5" }]}>78</Text>
              <Text style={[styles.recoveryBody, { color: "#B4C8BE" }]}>Good to train</Text>
            </View>
            <RecoveryRing score={78} />
          </View>
        </View>

        <View style={styles.widgetGrid}>
          {HEALTH_WIDGETS.filter(w => w.title !== "Today's Burn").map((item) => {
            const metricMap: Record<string, string> = {
              "Resting HR": "heartrate",
              "Sleep": "sleep",
              "Hydration": "hydration",
            };
            return (
              <TouchableOpacity
                key={item.title}
                onPress={() => router.push(`/health-detail?metric=${metricMap[item.title] || "sleep"}` as any)}
                activeOpacity={0.7}
                style={styles.widgetCard}
              >
                <View style={[{ backgroundColor: colors.card, borderColor: colors.border }, styles.widgetCardInner]}>
                  <View style={[styles.widgetIconWrap, { backgroundColor: item.color + "18" }]}>
                    <Ionicons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={[styles.widgetValue, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.widgetSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                  <Text style={[styles.widgetTitle, { color: colors.mutedForeground }]}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity onPress={() => router.push("/recovery-detail" as any)} style={{ marginBottom: 14 }}>
          <View style={[styles.bodyWidget, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={[styles.bodyIcon, { backgroundColor: "#7BE0B820" }]}>
                <Ionicons name="body-outline" size={20} color="#7BE0B8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bodyTitle, { color: colors.foreground }]}>Body Composition</Text>
                <Text style={[styles.bodySub, { color: colors.mutedForeground }]}>Weight, Height, BMI</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={["#7BE0B810", "#8FB8FF08", "transparent"]} style={StyleSheet.absoluteFill} />
            <TouchableOpacity onPress={() => router.push("/recovery-detail" as any)} style={styles.recoveryTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.recoveryBadge, { color: colors.success }]}>DAILY READINESS</Text>
                <Text style={[styles.recoveryTitle, { color: colors.foreground }]}>Recovery Score</Text>
                <Text style={[styles.recoveryBody, { color: colors.mutedForeground }]}>
                  Your body is primed for a heavy session today.{"\n"}Optimal recovery detected.
                </Text>
              </View>
              <RecoveryRing score={recoveryScore} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.tipsTitle, { color: colors.foreground }]}>AI Recovery Tips</Text>
          </View>
          {RECOVERY_TIPS.map((tip, i) => (
            <View
              key={tip.text}
              style={[
                styles.tipRow,
                i < RECOVERY_TIPS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
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

        <ActivityHeatmap />

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

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.foreground }]}>Body Metrics</Text>
              <Text style={[styles.chartSub, { color: colors.mutedForeground }]}>Current snapshot</Text>
            </View>
            <View style={[styles.chartBadge, { backgroundColor: "#A78BFA20" }]}>
              <Text style={[styles.chartBadgeText, { color: "#A78BFA" }]}>Updated today</Text>
            </View>
          </View>
          {[
            { label: "Weight", value: `${userProfile.weight} kg`, icon: "body-outline", color: "#A78BFA" },
            { label: "Height", value: `${userProfile.height} cm`, icon: "resize-outline", color: "#8FB8FF" },
            {
              label: "BMI",
              value: userProfile.height > 0
                ? (userProfile.weight / Math.pow(userProfile.height / 100, 2)).toFixed(1)
                : "—",
              icon: "analytics-outline",
              color: "#F3D27A",
            },
            {
              label: "Est. TDEE",
              value: `${Math.round(
                (10 * userProfile.weight + 6.25 * userProfile.height - 5 * userProfile.age + 5) * 1.55
              ).toLocaleString()} kcal`,
              icon: "flame-outline",
              color: "#FF2D78",
            },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={[
                styles.statRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.statIconWrap, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon as any} size={16} color={item.color} />
              </View>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.lifetimeTitle, { color: colors.foreground }]}>Lifetime Stats</Text>
          {[
            { label: "Total Calories Burned", value: userStats.caloriesBurned.toLocaleString(), icon: "flame", color: "#FF2D78" },
            { label: "Total Training Minutes", value: userStats.totalMinutes.toLocaleString(), icon: "time", color: colors.primary },
            { label: "Workouts Completed", value: userStats.totalWorkouts.toString(), icon: "barbell", color: colors.success },
            { label: "Longest Streak", value: `${userStats.longestStreak} days`, icon: "flash", color: "#F3D27A" },
          ].map((item, i, arr) => (
            <View
              key={item.label}
              style={[
                styles.statRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.statIconWrap, { backgroundColor: item.color + "18" }]}>
                <Ionicons name={item.icon as any} size={16} color={item.color} />
              </View>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      <AIChatModal visible={showAICoach} onClose={() => setShowAICoach(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  syncBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  syncDot: { width: 6, height: 6, borderRadius: 3 },
  syncText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  coachBtn: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, overflow: "hidden" },
  content: { paddingHorizontal: 20 },

  statsCard: { borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: "hidden" },
  lifetimeTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  statIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  recoveryCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 14, overflow: "hidden" },
  recoveryTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  recoveryBadge: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2, marginBottom: 4 },
  recoveryTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.4, marginBottom: 6 },
  recoveryBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  widgetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  widgetCard: { width: "48.5%" },
  widgetCardInner: { borderRadius: 18, borderWidth: 1, padding: 14, minHeight: 130 },
  widgetIconWrap: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  widgetValue: { fontSize: 28, fontFamily: "Inter_700Bold", lineHeight: 30 },
  widgetSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  widgetTitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 10 },
  bodyWidget: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: "row" },
  bodyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  bodyTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  bodySub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  metricsListCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  metricRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  metricIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricInfo: { flex: 1 },
  metricLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  metricTip: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  metricRight: { alignItems: "flex-end", gap: 5, minWidth: 52 },
  metricVal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  metricTrack: { width: 52, height: 4, borderRadius: 2, overflow: "hidden" },
  metricFill: { height: "100%", borderRadius: 2 },

  tipsCard: { borderRadius: 18, borderWidth: 1, marginBottom: 14, overflow: "hidden" },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  tipsTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  tipIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  chartCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  chartHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  chartTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  chartSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  chartBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  chartBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  noData: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 20 },
});
