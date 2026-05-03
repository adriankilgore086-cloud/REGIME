import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS } from "@/constants/workouts";
import { XPProgressBar } from "@/components/XPProgressBar";

const SMART_RECS = [
  { id: "rec1", name: "HIIT Inferno", tag: "High Calorie Burn", minutes: 30, xp: 200, color: "#FF2D78", icon: "flame" as const },
  { id: "rec2", name: "Mobility Flow", tag: "Recovery Focused", minutes: 20, xp: 80, color: "#7BE0B8", icon: "body" as const },
  { id: "rec3", name: "Core Crusher", tag: "AI Recommended", minutes: 25, xp: 120, color: "#A78BFA", icon: "sparkles" as const },
];

const PR_BOARD = [
  { lift: "Bench Press", current: 100, prev: 90, unit: "kg", icon: "barbell-outline" as const, color: "#FF2D78" },
  { lift: "Back Squat", current: 130, prev: 125, unit: "kg", icon: "body-outline" as const, color: "#A78BFA" },
  { lift: "Deadlift", current: 160, prev: 155, unit: "kg", icon: "fitness-outline" as const, color: "#F3D27A" },
  { lift: "OHP", current: 72, prev: 70, unit: "kg", icon: "arrow-up-outline" as const, color: "#7BE0B8" },
  { lift: "Pull-ups", current: 15, prev: 12, unit: "reps", icon: "trending-up-outline" as const, color: "#8FB8FF" },
];

export default function StatsOverviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userStats, scheduledWorkouts, healthMetrics, level, rank, xpProgress } = useFitness();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const getWeekDates = () => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const weekWorkouts = weekDates.filter((date) => scheduledWorkouts.some((sw) => sw.date === date && sw.completed)).length;
  const weekCalories = weekDates.reduce((sum, date) => sum + (healthMetrics.find((h) => h.date === date)?.calories ?? 0), 0);
  const weekMinutes = weekDates.reduce((sum, date) => {
    return sum + scheduledWorkouts.filter((sw) => sw.date === date && sw.completed).reduce((minSum, sw) => {
      const w = SAMPLE_WORKOUTS.find((x) => x.id === sw.workoutId);
      return minSum + (w?.durationMinutes ?? 0);
    }, 0);
  }, 0);

  const maxCalories = Math.max(...healthMetrics.map((h) => h.calories), 0);

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
          <Text style={[styles.title, { color: colors.foreground }]}>Your Stats</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          <View style={[styles.xpCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <XPProgressBar xp={userStats.xp} level={level} rank={rank} xpProgress={xpProgress} />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week</Text>
          </View>

          <View style={[styles.weekWidget, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.weekStatCol}>
              <View style={[styles.weekStatIcon, { backgroundColor: colors.success + "20" }]}>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
              </View>
              <Text style={[styles.weekStatLabel, { color: colors.mutedForeground }]}>Workouts</Text>
              <Text style={[styles.weekStatValue, { color: colors.foreground }]}>{weekWorkouts}</Text>
              <Text style={[styles.weekStatSub, { color: colors.mutedForeground }]}>completed</Text>
            </View>
            <View style={[styles.weekStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.weekStatCol}>
              <View style={[styles.weekStatIcon, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.weekStatLabel, { color: colors.mutedForeground }]}>Minutes</Text>
              <Text style={[styles.weekStatValue, { color: colors.foreground }]}>{weekMinutes}</Text>
              <Text style={[styles.weekStatSub, { color: colors.mutedForeground }]}>total</Text>
            </View>
            <View style={[styles.weekStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.weekStatCol}>
              <View style={[styles.weekStatIcon, { backgroundColor: colors.accent + "20" }]}>
                <Ionicons name="flame-outline" size={24} color={colors.accent} />
              </View>
              <Text style={[styles.weekStatLabel, { color: colors.mutedForeground }]}>Calories</Text>
              <Text style={[styles.weekStatValue, { color: colors.foreground }]}>{weekCalories}</Text>
              <Text style={[styles.weekStatSub, { color: colors.mutedForeground }]}>burned</Text>
            </View>
          </View>

          <View style={[styles.statsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statsBoxHeader}>
              <Ionicons name="fire" size={20} color={colors.accent} />
              <Text style={[styles.statsBoxTitle, { color: colors.foreground }]}>Max Calories Burned</Text>
            </View>
            <Text style={[styles.statsBoxValue, { color: colors.accent }]}>{maxCalories} cal</Text>
            <Text style={[styles.statsBoxSub, { color: colors.mutedForeground }]}>in a single workout</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Records</Text>
            <View style={[styles.aiBadge, { backgroundColor: "#F3D27A15" }]}>
              <Ionicons name="trophy-outline" size={10} color="#F3D27A" />
              <Text style={[styles.aiLabel, { color: "#F3D27A" }]}>Your PRs</Text>
            </View>
          </View>

          {PR_BOARD.map((pr) => {
            const gain = pr.current - pr.prev;
            const gainPct = Math.round((gain / pr.prev) * 100);
            return (
              <View key={pr.lift} style={[styles.prCard, { backgroundColor: colors.card, borderColor: pr.color + "30" }]}>
                <LinearGradient colors={[pr.color + "14", "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
                <View style={[styles.prIconWrap, { backgroundColor: pr.color + "20" }]}>
                  <Ionicons name={pr.icon} size={20} color={pr.color} />
                </View>
                <View style={styles.prInfo}>
                  <Text style={[styles.prLiftName, { color: colors.mutedForeground }]}>{pr.lift}</Text>
                  <Text style={[styles.prValue, { color: colors.foreground }]}>
                    {pr.current}
                    <Text style={[styles.prUnit, { color: colors.mutedForeground }]}> {pr.unit}</Text>
                  </Text>
                </View>
                <View style={[styles.prBadge, { backgroundColor: pr.color + "20", borderColor: pr.color + "35" }]}>
                  <Ionicons name="arrow-up" size={10} color={pr.color} />
                  <Text style={[styles.prBadgeText, { color: pr.color }]}>+{gain}</Text>
                </View>
              </View>
            );
          })}

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Smart Recommendations</Text>
            <View style={[styles.aiBadge, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="sparkles" size={10} color={colors.primary} />
              <Text style={[styles.aiLabel, { color: colors.primary }]}>AI Powered</Text>
            </View>
          </View>

          {SMART_RECS.map((rec) => (
            <TouchableOpacity
              key={rec.id}
              style={[styles.recCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <LinearGradient colors={[rec.color + "12", "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={[styles.recIcon, { backgroundColor: rec.color + "20" }]}>
                <Ionicons name={rec.icon} size={22} color={rec.color} />
              </View>
              <View style={styles.recInfo}>
                <Text style={[styles.recName, { color: colors.foreground }]}>{rec.name}</Text>
                <Text style={[styles.recTag, { color: rec.color }]}>{rec.tag}</Text>
              </View>
              <View style={styles.recMeta}>
                <View style={[styles.recMetaItem, { backgroundColor: colors.muted }]}>
                  <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.recMetaText, { color: colors.mutedForeground }]}>{rec.minutes}m</Text>
                </View>
                <View style={[styles.recMetaItem, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.recXpText, { color: colors.primary }]}>+{rec.xp} XP</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  xpCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontFamily: "Poppins_600SemiBold", letterSpacing: -0.3 },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  aiLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  weekWidget: { borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  weekStatCol: { flex: 1, alignItems: "center", gap: 8 },
  weekStatIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  weekStatLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  weekStatValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  weekStatSub: { fontSize: 10, fontFamily: "Inter_400Regular" },
  weekStatDivider: { width: 1, height: 70 },
  statsBox: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 20 },
  statsBoxHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  statsBoxTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  statsBoxValue: { fontSize: 32, fontFamily: "Inter_700Bold", marginBottom: 4 },
  statsBoxSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  prCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 12, overflow: "hidden" },
  prIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  prInfo: { flex: 1 },
  prLiftName: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 2 },
  prValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  prUnit: { fontSize: 12, fontFamily: "Inter_400Regular" },
  prBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  prBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  recCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 12, overflow: "hidden" },
  recIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  recInfo: { marginBottom: 10 },
  recName: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  recTag: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  recMeta: { flexDirection: "row", gap: 8 },
  recMetaItem: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  recMetaText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  recXpText: { fontSize: 11, fontFamily: "Inter_700Bold" },
});
