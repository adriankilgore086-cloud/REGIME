import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@shared/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";

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

const METRIC_DETAILS: Record<string, any> = {
  sleep: {
    title: "Sleep Quality",
    icon: "moon-outline",
    color: "#A78BFA",
    value: "7.5",
    unit: "hrs",
    status: "Excellent",
    tips: [
      "Maintain a consistent sleep schedule (same bed/wake time)",
      "Avoid screens 1 hour before bed",
      "Keep bedroom cool (16-19°C is optimal)",
      "Limit caffeine after 2pm",
      "Exercise regularly but not within 3 hours of sleep",
    ],
    chartLabel: "Sleep Hours (Last 7 Days)",
    chartData: [6.5, 7.2, 7.8, 6.9, 8.1, 7.5, 7.3],
  },
  hydration: {
    title: "Hydration Level",
    icon: "water-outline",
    color: "#8FB8FF",
    value: "2.4",
    unit: "L",
    status: "Good",
    tips: [
      "Drink water consistently throughout the day",
      "Aim for at least 2-3L daily (varies by activity)",
      "Drink 500ml before, during, and after workouts",
      "Monitor urine color (pale yellow = hydrated)",
      "Limit sugary drinks and excess caffeine",
    ],
    chartLabel: "Daily Water Intake (Last 7 Days)",
    chartData: [1.8, 2.1, 2.4, 2.0, 2.5, 2.3, 2.4],
  },
  heartrate: {
    title: "Resting Heart Rate",
    icon: "heart-outline",
    color: "#FF2D78",
    value: "62",
    unit: "bpm",
    status: "Excellent",
    tips: [
      "Resting HR between 60-100 bpm is normal",
      "Lower RHR typically indicates better cardiovascular fitness",
      "Measure RHR first thing in the morning",
      "Endurance training can lower your RHR",
      "Stress and poor sleep can increase RHR",
    ],
    chartLabel: "Resting Heart Rate (Last 7 Days)",
    chartData: [65, 63, 62, 64, 61, 62, 62],
  },
  readiness: {
    title: "Recovery Readiness Score",
    icon: "pulse-outline",
    color: "#7BE0B8",
    value: "78",
    unit: "%",
    status: "Good",
    tips: [
      "Score combines sleep quality, HRV, and recovery metrics",
      "80%+ = Great for intense workouts",
      "50-80% = Good for moderate training",
      "Below 50% = Focus on recovery activities",
      "Track trends over time for insights",
    ],
    chartLabel: "Readiness Score (Last 7 Days)",
    chartData: [72, 75, 78, 74, 80, 77, 78],
  },
  calories: {
    title: "Daily Calorie Burn",
    icon: "flame-outline",
    color: "#FF6B6B",
    value: "403",
    unit: "kcal",
    status: "Active",
    tips: [
      "Includes BMR (Basal Metabolic Rate) + exercise",
      "Average daily burn varies by age, weight, and activity",
      "Workouts typically burn 200-500+ kcal",
      "Higher intensity = more calories burned",
      "Consistency matters more than single day totals",
    ],
    chartLabel: "Daily Calorie Burn (Last 7 Days)",
    chartData: [350, 420, 403, 380, 450, 410, 403],
  },
};

export default function HealthDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { metric } = useLocalSearchParams<{ metric: string }>();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const currentMetric = metric || "sleep";
  const data = currentMetric && METRIC_DETAILS[currentMetric] ? METRIC_DETAILS[currentMetric] : METRIC_DETAILS.sleep;
  const maxChartVal = Math.max(...data.chartData);

  const metrics = [
    { key: "sleep", title: "Sleep", icon: "moon-outline", color: "#A78BFA" },
    { key: "hydration", title: "Hydration", icon: "water-outline", color: "#8FB8FF" },
    { key: "heartrate", title: "Heart Rate", icon: "heart-outline", color: "#FF2D78" },
    { key: "readiness", title: "Readiness", icon: "pulse-outline", color: "#7BE0B8" },
    { key: "calories", title: "Calories", icon: "flame-outline", color: "#FF6B6B" },
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
          <Text style={[styles.title, { color: colors.foreground }]}>Health Details</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsScroll} contentContainerStyle={styles.metricsContent}>
          {metrics.map((m) => {
            const isActive = currentMetric === m.key;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => router.push(`/health-detail?metric=${m.key}` as any)}
                style={[
                  styles.metricBtn,
                  isActive && { borderColor: m.color, borderWidth: 2, backgroundColor: m.color + "15" },
                  !isActive && { borderColor: colors.border, borderWidth: 1 },
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.metricBtnIcon, { backgroundColor: m.color + "20" }]}>
                  <Ionicons name={m.icon as any} size={16} color={m.color} />
                </View>
                <Text style={[styles.metricBtnText, { color: isActive ? m.color : colors.mutedForeground }]}>
                  {m.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.content}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: data.color + "18" }]}>
              <Ionicons name={data.icon} size={32} color={data.color} />
            </View>
            <Text style={[styles.metricTitle, { color: colors.foreground }]}>{data.title}</Text>
            <View style={styles.metricValueRow}>
              <Text style={[styles.metricValue, { color: data.color }]}>{data.value}</Text>
              <Text style={[styles.metricUnit, { color: colors.mutedForeground }]}>{data.unit}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: data.color + "20" }]}>
              <Text style={[styles.statusText, { color: data.color }]}>{data.status}</Text>
            </View>
          </View>

          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>{data.chartLabel}</Text>
            <BarChart data={data.chartData} max={maxChartVal * 1.1} color={data.color} />
          </View>

          <View style={styles.tipsSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Optimization Tips</Text>
            {data.tips.map((tip: string, i: number) => (
              <View key={i} style={[styles.tipItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.tipNumber, { backgroundColor: data.color + "20" }]}>
                  <Text style={[styles.tipNumberText, { color: data.color }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={[styles.infoText, { color: colors.foreground, flex: 1 }]}>
                Track your metrics consistently to see patterns and improvements over time. Small changes compound into significant health gains.
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: "Poppins_700Bold", letterSpacing: -0.5 },
  metricsScroll: { paddingHorizontal: 20, paddingBottom: 12 },
  metricsContent: { gap: 8, paddingRight: 20 },
  metricBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, minWidth: 100 },
  metricBtnIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  metricBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20 },
  metricCard: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: "center", marginBottom: 20 },
  metricIconWrap: { width: 60, height: 60, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  metricTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12, textAlign: "center" },
  metricValueRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginBottom: 12 },
  metricValue: { fontSize: 42, fontFamily: "Poppins_700Bold" },
  metricUnit: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  statusText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  chartCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  chartTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 16 },
  tipsSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  tipItem: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  tipNumber: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  tipNumberText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  infoCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 20 },
  infoText: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 18 },
});
