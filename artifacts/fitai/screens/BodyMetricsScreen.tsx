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

function BarChart({ data, max, color }: { data: number[]; max: number; color: string }) {
  const colors = useColors();
  const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
  container: { flexDirection: "row", alignItems: "flex-end", height: 120, gap: 6 },
  barCol: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  barTrack: { flex: 1, width: "100%", borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", borderRadius: 4 },
  label: { fontSize: 9, fontFamily: "Inter_500Medium" },
});

export default function BodyMetricsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const bodyMetrics = {
    weight: 75,
    height: 180,
    bmi: 23.1,
  };

  const activityData = [45, 60, 55, 70, 65, 80, 75];
  const maxActivity = Math.max(...activityData);

  const muscleGroups = [
    { name: "Chest", percentage: 85, color: "#FF2D78" },
    { name: "Back", percentage: 92, color: "#8FB8FF" },
    { name: "Legs", percentage: 78, color: "#7BE0B8" },
    { name: "Shoulders", percentage: 88, color: "#A78BFA" },
    { name: "Arms", percentage: 76, color: "#F3D27A" },
    { name: "Core", percentage: 91, color: "#FF6B35" },
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
          <Text style={[styles.title, { color: colors.foreground }]}>Body Metrics</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          <View style={[styles.metricsGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metricBox}>
              <Text style={[styles.metricValue, { color: colors.primary }]}>{bodyMetrics.weight}</Text>
              <Text style={[styles.metricUnit, { color: colors.mutedForeground }]}>kg</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Weight</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.metricBox}>
              <Text style={[styles.metricValue, { color: colors.primary }]}>{bodyMetrics.height}</Text>
              <Text style={[styles.metricUnit, { color: colors.mutedForeground }]}>cm</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Height</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.metricBox}>
              <Text style={[styles.metricValue, { color: bodyMetrics.bmi < 25 ? colors.success : colors.accent }]}>
                {bodyMetrics.bmi}
              </Text>
              <Text style={[styles.metricUnit, { color: colors.mutedForeground }]}>BMI</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Normal</Text>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Weekly Activity</Text>
            <BarChart data={activityData} max={maxActivity} color={colors.primary} />
          </View>

          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Muscle Groups Trained</Text>
            {muscleGroups.map((m, i) => (
              <View
                key={m.name}
                style={[
                  styles.muscleRow,
                  i < muscleGroups.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.muscleName, { color: colors.foreground }]}>{m.name}</Text>
                <View style={[styles.muscleTrack, { backgroundColor: colors.muted }]}>
                  <LinearGradient
                    colors={[m.color, m.color + "70"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.muscleFill, { width: `${m.percentage}%` }]}
                  />
                </View>
                <Text style={[styles.musclePercent, { color: m.color }]}>{m.percentage}%</Text>
              </View>
            ))}
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
  metricsGrid: { borderRadius: 16, borderWidth: 1, flexDirection: "row", padding: 20, marginBottom: 14, alignItems: "center", justifyContent: "space-around" },
  metricBox: { alignItems: "center", flex: 1 },
  metricValue: { fontSize: 32, fontFamily: "Inter_700Bold" },
  metricUnit: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  metricLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 6 },
  divider: { width: 1, height: 50 },
  section: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 12 },
  muscleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  muscleName: { width: 70, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  muscleTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  muscleFill: { height: "100%", borderRadius: 3 },
  musclePercent: { width: 40, textAlign: "right", fontSize: 11, fontFamily: "Inter_700Bold" },
});
