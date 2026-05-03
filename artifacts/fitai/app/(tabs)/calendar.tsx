import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, Animated,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS, CATEGORY_COLORS } from "@/constants/workouts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates() {
  const today = new Date();
  const week = [];
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    week.push(d);
  }
  return week;
}

function WeeklyReport({ userStats, scheduledWorkouts, onClose }: {
  userStats: any; scheduledWorkouts: any[]; onClose: () => void;
}) {
  const colors = useColors();
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const weekWorkouts = scheduledWorkouts.filter((sw) => {
    const d = new Date(sw.date);
    return d >= weekStart && sw.completed;
  });

  const weeklyStats = {
    completed: weekWorkouts.length,
    calories: weekWorkouts.reduce((sum, sw) => {
      const w = SAMPLE_WORKOUTS.find((x) => x.id === sw.workoutId);
      return sum + (w?.calories ?? 0);
    }, 0),
    minutes: weekWorkouts.reduce((sum, sw) => {
      const w = SAMPLE_WORKOUTS.find((x) => x.id === sw.workoutId);
      return sum + (w?.durationMinutes ?? 0);
    }, 0),
    xpEarned: weekWorkouts.reduce((sum, sw) => {
      const w = SAMPLE_WORKOUTS.find((x) => x.id === sw.workoutId);
      return sum + (w?.xpReward ?? 0);
    }, 0),
    streak: userStats.streak,
    totalWorkouts: userStats.totalWorkouts,
  };

  const consistencyPct = Math.round((weeklyStats.completed / 5) * 100);

  const AI_INSIGHTS = [
    weeklyStats.completed >= 4
      ? "Outstanding week — you trained 4+ days. Your consistency is elite-level."
      : weeklyStats.completed >= 2
        ? "Solid week. Aim for one more session to hit your weekly target."
        : "Recovery week detected. A light session tomorrow will maintain momentum.",
    userStats.streak >= 7
      ? `Your ${userStats.streak}-day streak shows iron discipline. Keep protecting it.`
      : "Building your streak is your #1 priority. Even 20-minute sessions count.",
    weeklyStats.calories > 1000
      ? `You burned ${weeklyStats.calories.toLocaleString()} cal this week — well above average.`
      : "Add one high-intensity session next week to boost your calorie output.",
  ];

  const MUSCLE_FOCUS = ["Chest", "Back", "Shoulders", "Triceps", "Core", "Legs"];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={rStyles.overlay}>
        <View style={[rStyles.sheet, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={["#8FB8FF12", "#A78BFA10", "transparent"]}
            style={rStyles.gradient}
          />

          <View style={rStyles.handle} />

          <View style={rStyles.header}>
            <View>
              <Text style={[rStyles.headerSub, { color: colors.primary }]}>WEEKLY RECAP</Text>
              <Text style={[rStyles.headerTitle, { color: colors.foreground }]}>Week in Review</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[rStyles.closeBtn, { backgroundColor: colors.muted }]}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rStyles.content}>
            <View style={rStyles.statsRow}>
              {[
                { label: "Workouts", value: weeklyStats.completed.toString(), icon: "barbell-outline", color: colors.primary },
                { label: "Calories", value: weeklyStats.calories.toLocaleString(), icon: "flame-outline", color: "#FF2D78" },
                { label: "Minutes", value: weeklyStats.minutes.toString(), icon: "time-outline", color: colors.success },
                { label: "XP Earned", value: `+${weeklyStats.xpEarned}`, icon: "flash-outline", color: "#A78BFA" },
              ].map((s) => (
                <View key={s.label} style={[rStyles.statBox, { backgroundColor: colors.card, borderColor: s.color + "30" }]}>
                  <Ionicons name={s.icon as any} size={16} color={s.color} />
                  <Text style={[rStyles.statVal, { color: s.color }]}>{s.value}</Text>
                  <Text style={[rStyles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={[rStyles.consistencyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={rStyles.consistencyHeader}>
                <Text style={[rStyles.cardTitle, { color: colors.foreground }]}>Consistency Score</Text>
                <Text style={[rStyles.consistencyPct, { color: consistencyPct >= 70 ? colors.success : consistencyPct >= 40 ? "#F3D27A" : colors.accent }]}>
                  {consistencyPct}%
                </Text>
              </View>
              <View style={rStyles.weekGrid}>
                {DAYS.map((day, i) => {
                  const d = new Date(weekStart);
                  d.setDate(weekStart.getDate() + i);
                  const iso = d.toISOString().split("T")[0];
                  const done = scheduledWorkouts.some((sw) => sw.date === iso && sw.completed);
                  const skipped = scheduledWorkouts.some((sw) => sw.date === iso && sw.skipped);
                  return (
                    <View key={day} style={rStyles.dayCell}>
                      <Text style={[rStyles.dayName, { color: colors.mutedForeground }]}>{day.slice(0, 1)}</Text>
                      <View style={[rStyles.dayDot,
                        done && { backgroundColor: colors.success },
                        skipped && { backgroundColor: colors.destructive },
                        !done && !skipped && { backgroundColor: colors.muted },
                      ]} />
                    </View>
                  );
                })}
              </View>
              <View style={rStyles.legendRow}>
                <View style={rStyles.legendItem}>
                  <View style={[rStyles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={[rStyles.legendText, { color: colors.mutedForeground }]}>Done</Text>
                </View>
                <View style={rStyles.legendItem}>
                  <View style={[rStyles.legendDot, { backgroundColor: colors.destructive }]} />
                  <Text style={[rStyles.legendText, { color: colors.mutedForeground }]}>Skipped</Text>
                </View>
                <View style={rStyles.legendItem}>
                  <View style={[rStyles.legendDot, { backgroundColor: colors.muted }]} />
                  <Text style={[rStyles.legendText, { color: colors.mutedForeground }]}>Rest</Text>
                </View>
              </View>
            </View>

            <View style={[rStyles.muscleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[rStyles.cardTitle, { color: colors.foreground }]}>Muscle Groups Trained</Text>
              <View style={rStyles.muscleTags}>
                {MUSCLE_FOCUS.map((m, i) => (
                  <View key={m} style={[rStyles.muscleChip, {
                    backgroundColor: i < 4 ? colors.primary + "20" : colors.muted,
                    borderColor: i < 4 ? colors.primary + "40" : colors.border,
                  }]}>
                    <Text style={[rStyles.muscleText, { color: i < 4 ? colors.primary : colors.mutedForeground }]}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[rStyles.aiCard, { backgroundColor: "#8FB8FF08", borderColor: "#8FB8FF25" }]}>
              <View style={rStyles.aiHeader}>
                <LinearGradient colors={["#8FB8FF", "#6B9EFF"]} style={rStyles.aiAvatarGrad}>
                  <Ionicons name="sparkles" size={14} color="#0D0D0D" />
                </LinearGradient>
                <Text style={[rStyles.aiLabel, { color: colors.primary }]}>AI Coach Analysis</Text>
              </View>
              {AI_INSIGHTS.map((insight, i) => (
                <View key={i} style={rStyles.insightRow}>
                  <View style={[rStyles.insightDot, { backgroundColor: colors.primary }]} />
                  <Text style={[rStyles.insightText, { color: colors.foreground }]}>{insight}</Text>
                </View>
              ))}
            </View>

            <View style={[rStyles.streakCard, { backgroundColor: "#F3D27A12", borderColor: "#F3D27A30" }]}>
              <View style={rStyles.streakInner}>
                <Ionicons name="flame" size={28} color="#F3D27A" />
                <View>
                  <Text style={[rStyles.streakNum, { color: "#F3D27A" }]}>{userStats.streak} day streak</Text>
                  <Text style={[rStyles.streakSub, { color: colors.mutedForeground }]}>
                    {userStats.streak >= 7 ? "You're on fire. Don't stop now." : "Keep it going — every day counts."}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const rStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  sheet: { maxHeight: "90%", borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden" },
  gradient: { position: "absolute", top: 0, left: 0, right: 0, height: 180 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#FFFFFF25", alignSelf: "center", marginTop: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  headerSub: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5, marginBottom: 3 },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.8 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statBox: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 10, alignItems: "center", gap: 4 },
  statVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 9, fontFamily: "Inter_500Medium", textAlign: "center" },
  consistencyCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  consistencyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  consistencyPct: { fontSize: 22, fontFamily: "Inter_700Bold" },
  weekGrid: { flexDirection: "row", gap: 6, marginBottom: 10 },
  dayCell: { flex: 1, alignItems: "center", gap: 6 },
  dayName: { fontSize: 10, fontFamily: "Inter_500Medium" },
  dayDot: { width: 28, height: 28, borderRadius: 9 },
  legendRow: { flexDirection: "row", gap: 14, justifyContent: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  muscleCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  muscleTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  muscleChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  muscleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  aiCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  aiAvatarGrad: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  aiLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  insightDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  insightText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  streakCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  streakInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  streakNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
  streakSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { scheduledWorkouts, scheduleWorkout, userStats } = useFitness();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split("T")[0];

  const getWorkoutsForDate = (date: string) => scheduledWorkouts.filter((sw) => sw.date === date);
  const selectedWorkouts = getWorkoutsForDate(selectedDate);

  const weekCompleted = weekDates.filter((d) => {
    const iso = d.toISOString().split("T")[0];
    return scheduledWorkouts.some((sw) => sw.date === iso && sw.completed);
  }).length;

  const handleAddWorkout = async (workoutId: string) => {
    await scheduleWorkout(workoutId, selectedDate);
    setShowAddModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Schedule</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            onPress={() => setShowReport(true)}
            style={[styles.reportBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="bar-chart-outline" size={15} color={colors.primary} />
            <Text style={[styles.reportBtnText, { color: colors.primary }]}>Week Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color="#0D0D0D" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setShowReport(true)}
        style={[styles.weekBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.85}
      >
        <LinearGradient colors={["#8FB8FF12", "#A78BFA10", "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        <View style={styles.weekBannerLeft}>
          <View style={[styles.weekRingOuter, { borderColor: colors.primary + "40" }]}>
            <View style={[styles.weekRingInner, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.weekRingNum, { color: colors.primary }]}>{weekCompleted}</Text>
              <Text style={[styles.weekRingOf, { color: colors.mutedForeground }]}>/ 5</Text>
            </View>
          </View>
          <View>
            <Text style={[styles.weekBannerTitle, { color: colors.foreground }]}>This Week</Text>
            <Text style={[styles.weekBannerSub, { color: colors.mutedForeground }]}>
              {weekCompleted === 0 ? "Let's get started" :
                weekCompleted < 3 ? "Keep pushing" :
                  weekCompleted < 5 ? "Great momentum" : "Perfect week!"}
            </Text>
          </View>
        </View>
        <View style={styles.weekBannerRight}>
          <Text style={[styles.weekBannerStreak, { color: "#F3D27A" }]}>🔥 {userStats.streak}d</Text>
          <Text style={[styles.weekBannerLabel, { color: colors.mutedForeground }]}>streak</Text>
          <View style={[styles.viewBtn, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.viewBtnText, { color: colors.primary }]}>View →</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={[styles.weekStrip, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {weekDates.map((date) => {
          const iso = date.toISOString().split("T")[0];
          const isToday = iso === today;
          const isSelected = iso === selectedDate;
          const hasWorkout = getWorkoutsForDate(iso).length > 0;
          const done = scheduledWorkouts.some((sw) => sw.date === iso && sw.completed);

          return (
            <TouchableOpacity key={iso} onPress={() => setSelectedDate(iso)} style={styles.dayCell}>
              <Text style={[styles.dayName, { color: isSelected ? colors.primary : colors.mutedForeground }]}>
                {DAYS[date.getDay()]}
              </Text>
              <View style={[
                styles.dayNum,
                isSelected && { backgroundColor: colors.primary },
                isToday && !isSelected && { borderWidth: 1, borderColor: colors.primary },
                done && !isSelected && { borderWidth: 1, borderColor: colors.success + "60" },
              ]}>
                <Text style={[styles.dayNumText, {
                  color: isSelected ? "#0D0D0D" : isToday ? colors.primary : done ? colors.success : colors.foreground,
                }]}>
                  {date.getDate()}
                </Text>
              </View>
              {hasWorkout && !done && (
                <View style={[styles.dotIndicator, { backgroundColor: isSelected ? "#0D0D0D" : colors.mutedForeground }]} />
              )}
              {done && <Ionicons name="checkmark" size={10} color={colors.success} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        scrollEventThrottle={16}
        removeClippedSubviews={Platform.OS !== "web"}
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.selectedDateLabel, { color: colors.mutedForeground }]}>
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>

        {selectedWorkouts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="calendar-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No workouts scheduled</Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={[styles.addWorkoutBtn, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.addWorkoutText, { color: colors.primary }]}>Add Workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          selectedWorkouts.map((sw) => {
            const workout = SAMPLE_WORKOUTS.find((w) => w.id === sw.workoutId);
            if (!workout) return null;
            const catColor = CATEGORY_COLORS[workout.category];
            return (
              <View key={sw.id} style={[styles.workoutRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.catBar, { backgroundColor: catColor }]} />
                <View style={styles.workoutInfo}>
                  <View style={styles.workoutTop}>
                    <Text style={[styles.workoutName, { color: colors.foreground }]}>{workout.name}</Text>
                    {sw.completed && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
                    {sw.skipped && <Ionicons name="close-circle" size={18} color={colors.destructive} />}
                  </View>
                  <Text style={[styles.workoutMeta, { color: colors.mutedForeground }]}>
                    {workout.durationMinutes}m · {workout.calories} cal · {workout.difficulty}
                  </Text>
                  <View style={styles.muscleChips}>
                    {workout.targetMuscles.slice(0, 3).map((m) => (
                      <View key={m} style={[styles.chip, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{m}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            );
          })
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>Workout Library</Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Tap to schedule on selected date</Text>

        {SAMPLE_WORKOUTS.map((workout) => {
          const catColor = CATEGORY_COLORS[workout.category];
          return (
            <TouchableOpacity
              key={workout.id}
              onPress={() => handleAddWorkout(workout.id)}
              style={[styles.libraryRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <View style={[styles.libraryIcon, { backgroundColor: catColor + "20" }]}>
                <Ionicons name="barbell-outline" size={18} color={catColor} />
              </View>
              <View style={styles.libraryInfo}>
                <Text style={[styles.libraryName, { color: colors.foreground }]}>{workout.name}</Text>
                <Text style={[styles.libraryMeta, { color: colors.mutedForeground }]}>
                  {workout.durationMinutes}m · {workout.category} · {workout.difficulty}
                </Text>
              </View>
              <View style={[styles.xpChip, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.xpText, { color: colors.primary }]}>+{workout.xpReward} XP</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {showReport && (
        <WeeklyReport
          userStats={userStats}
          scheduledWorkouts={scheduledWorkouts}
          onClose={() => setShowReport(false)}
        />
      )}

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add to {selectedDate}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              {SAMPLE_WORKOUTS.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => handleAddWorkout(w.id)}
                  style={[styles.modalWorkoutRow, { borderColor: colors.border }]}
                >
                  <Text style={[styles.modalWorkoutName, { color: colors.foreground }]}>{w.name}</Text>
                  <Text style={[styles.modalWorkoutMeta, { color: colors.mutedForeground }]}>{w.durationMinutes}m · +{w.xpReward} XP</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontFamily: "Poppins_700Bold", letterSpacing: -0.5 },
  headerBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1 },
  reportBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  addBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  weekBanner: { marginHorizontal: 20, marginBottom: 12, borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", overflow: "hidden" },
  weekBannerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  weekRingOuter: { width: 52, height: 52, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  weekRingInner: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 1 },
  weekRingNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
  weekRingOf: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
  weekBannerTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  weekBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  weekBannerRight: { alignItems: "flex-end", gap: 2 },
  weekBannerStreak: { fontSize: 17, fontFamily: "Inter_700Bold" },
  weekBannerLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  viewBtn: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  viewBtnText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  weekStrip: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  dayCell: { flex: 1, alignItems: "center", gap: 5 },
  dayName: { fontSize: 10, fontFamily: "Inter_500Medium" },
  dayNum: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dayNumText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dotIndicator: { width: 4, height: 4, borderRadius: 2 },
  content: { paddingHorizontal: 20, paddingTop: 14 },
  selectedDateLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 14 },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", gap: 12, marginBottom: 24 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  addWorkoutBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  addWorkoutText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  workoutRow: { flexDirection: "row", borderRadius: 16, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  catBar: { width: 4 },
  workoutInfo: { flex: 1, padding: 14 },
  workoutTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  workoutName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  workoutMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
  muscleChips: { flexDirection: "row", gap: 6 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  chipText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: -0.3, marginBottom: 4 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 12 },
  libraryRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  libraryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  libraryInfo: { flex: 1 },
  libraryName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  libraryMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  xpChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  xpText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalWorkoutRow: { paddingVertical: 12, borderBottomWidth: 1, gap: 3 },
  modalWorkoutName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalWorkoutMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cancelText: { textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular" },
});
