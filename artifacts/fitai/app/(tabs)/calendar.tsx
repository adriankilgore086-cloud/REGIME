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

function getMonthDates(dateStr: string) {
  const [year, month] = dateStr.split("-").map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const prevLastDay = new Date(year, month - 1, 0);
  
  const dates = [];
  const startDate = firstDay.getDay();
  
  // Add previous month's days
  for (let i = startDate - 1; i >= 0; i--) {
    const d = new Date(prevLastDay);
    d.setDate(prevLastDay.getDate() - i);
    dates.push({ date: d.toISOString().split("T")[0], isCurrentMonth: false });
  }
  
  // Add current month's days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month - 1, i);
    dates.push({ date: d.toISOString().split("T")[0], isCurrentMonth: true });
  }
  
  // Add next month's days
  const remaining = 42 - dates.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month, i);
    dates.push({ date: d.toISOString().split("T")[0], isCurrentMonth: false });
  }
  
  return dates;
}

function getYearMonths() {
  return Array.from({ length: 12 }, (_, month) => {
    const date = new Date();
    date.setMonth(month, 1);
    return {
      month,
      label: date.toLocaleDateString("en-US", { month: "long" }),
      days: new Date(date.getFullYear(), month + 1, 0).getDate(),
    };
  });
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

            <View style={[rStyles.aiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={rStyles.aiHeader}>
                <View style={[rStyles.aiAvatarGrad, { backgroundColor: colors.muted }]}>
                  <Ionicons name="sparkles" size={14} color={colors.mutedForeground} />
                </View>
                <Text style={[rStyles.aiLabel, { color: colors.foreground }]}>AI Coach Analysis</Text>
              </View>
              {AI_INSIGHTS.map((insight, i) => (
                <View key={i} style={rStyles.insightRow}>
                  <View style={[rStyles.insightDot, { backgroundColor: colors.primary }]} />
                  <Text style={[rStyles.insightText, { color: colors.foreground }]}>{insight}</Text>
                </View>
              ))}
            </View>

            <View style={[rStyles.streakCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={rStyles.streakInner}>
                <Ionicons name="flame" size={22} color={colors.mutedForeground} />
                <View>
                  <Text style={[rStyles.streakNum, { color: colors.foreground }]}>{userStats.streak} day streak</Text>
                  <Text style={[rStyles.streakSub, { color: colors.mutedForeground }]}>
                    {userStats.streak >= 7 ? "Consistency remains strong." : "Keep it steady."}
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
  handle: { width: 28, height: 3, borderRadius: 2, backgroundColor: "#FFFFFF20", alignSelf: "center", marginTop: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  headerSub: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.8, marginBottom: 3 },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.6 },
  closeBtn: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
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
  aiLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  insightDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  insightText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  streakCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  streakInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  streakNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
  streakSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { scheduledWorkouts, scheduleWorkout, unscheduleWorkout, userStats } = useFitness();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showYearView, setShowYearView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split("T")[0]);
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<string[]>([]);
  const [upcomingOrder, setUpcomingOrder] = useState<string[]>([]);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split("T")[0];
  const monthDates = getMonthDates(currentMonth);

  const getWorkoutsForDate = (date: string) => scheduledWorkouts.filter((sw) => sw.date === date);
  const selectedWorkouts = getWorkoutsForDate(selectedDate);
  
  // Get upcoming workouts (next 7 days from today)
  const getUpcomingWorkouts = () => {
    const upcoming: typeof scheduledWorkouts = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today + "T12:00:00");
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const dayWorkouts = getWorkoutsForDate(dateStr);
      upcoming.push(...dayWorkouts);
    }
    // Sort by upcomingOrder if it exists, otherwise keep original order
    if (upcomingOrder.length === 0) {
      return upcoming;
    }
    return upcoming.sort((a, b) => {
      const aIdx = upcomingOrder.indexOf(a.id);
      const bIdx = upcomingOrder.indexOf(b.id);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  };
  
  const upcomingWorkouts = getUpcomingWorkouts();
  
  const moveWorkoutUp = (workoutId: string) => {
    if (upcomingOrder.length === 0) {
      setUpcomingOrder(upcomingWorkouts.map(w => w.id));
    }
    const newOrder = [...(upcomingOrder.length > 0 ? upcomingOrder : upcomingWorkouts.map(w => w.id))];
    const idx = newOrder.indexOf(workoutId);
    if (idx > 0) {
      [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
      setUpcomingOrder(newOrder);
    }
  };
  
  const moveWorkoutDown = (workoutId: string) => {
    if (upcomingOrder.length === 0) {
      setUpcomingOrder(upcomingWorkouts.map(w => w.id));
    }
    const newOrder = [...(upcomingOrder.length > 0 ? upcomingOrder : upcomingWorkouts.map(w => w.id))];
    const idx = newOrder.indexOf(workoutId);
    if (idx < newOrder.length - 1) {
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
      setUpcomingOrder(newOrder);
    }
  };

  const weekCompleted = weekDates.filter((d) => {
    const iso = d.toISOString().split("T")[0];
    return scheduledWorkouts.some((sw) => sw.date === iso && sw.completed);
  }).length;
  const yearMonths = getYearMonths();

  const handleAddWorkout = async (workoutId: string) => {
    await scheduleWorkout(workoutId, selectedDate);
  };

  const handleToggleWorkoutSelection = (workoutId: string) => {
    setSelectedWorkoutIds((prev) =>
      prev.includes(workoutId) ? prev.filter((id) => id !== workoutId) : [...prev, workoutId]
    );
  };

  const handleAddMultipleWorkouts = async () => {
    for (const workoutId of selectedWorkoutIds) {
      await scheduleWorkout(workoutId, selectedDate);
    }
    setSelectedWorkoutIds([]);
    setShowAddModal(false);
  };

  const handleRemoveWorkout = async (scheduledWorkoutId: string) => {
    await unscheduleWorkout(scheduledWorkoutId);
  };

  const goToMonth = (offset: number) => {
    const d = new Date(currentMonth + "T12:00:00");
    d.setMonth(d.getMonth() + offset);
    setCurrentMonth(d.toISOString().split("T")[0]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.foreground }]}>Schedule</Text>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => goToMonth(-1)} style={[styles.monthBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.foreground }]}>
              {new Date(currentMonth + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>
            <TouchableOpacity onPress={() => goToMonth(1)} style={[styles.monthBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            onPress={() => setShowReport(true)}
            style={[styles.reportBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Ionicons name="bar-chart-outline" size={15} color={colors.primary} />
            <Text style={[styles.reportBtnText, { color: colors.primary }]}>Week Report</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Calendar Grid */}
      <View style={[styles.calendarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Day headers */}
        <View style={styles.dayHeaderRow}>
          {DAYS.map((day) => (
            <View key={day} style={styles.dayHeaderCell}>
              <Text style={[styles.dayHeaderText, { color: colors.mutedForeground }]}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {monthDates.map(({ date, isCurrentMonth }, index) => {
            const workouts = getWorkoutsForDate(date);
            const isSelected = date === selectedDate;
            const isToday = date === today;
            const done = scheduledWorkouts.some((sw) => sw.date === date && sw.completed);

            return (
              <TouchableOpacity
                key={date}
                onPress={() => setSelectedDate(date)}
                style={[
                  styles.calendarCell,
                  !isCurrentMonth && { opacity: 0.3 },
                  isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  isToday && !isSelected && { borderColor: colors.primary + "60", borderWidth: 2 },
                ]}
              >
                <Text style={[styles.calendarCellDate, { color: isSelected ? "#0D0D0D" : colors.foreground }]}>
                  {new Date(date + "T12:00:00").getDate()}
                </Text>
                {workouts.length > 0 && (
                  <View style={styles.workoutIndicators}>
                    {workouts.slice(0, 2).map((w, i) => (
                      <View
                        key={i}
                        style={[
                          styles.indicator,
                          {
                            backgroundColor: isSelected ? "#0D0D0D20" : colors.primary + "40",
                          },
                        ]}
                      />
                    ))}
                    {workouts.length > 2 && (
                      <Text style={[styles.moreText, { color: isSelected ? "#0D0D0D" : colors.primary }]}>
                        +{workouts.length - 2}
                      </Text>
                    )}
                  </View>
                )}
                {done && <Ionicons name="checkmark-circle" size={14} color={colors.success} style={styles.doneIcon} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Upcoming Workouts Section */}
      {upcomingWorkouts.length > 0 && (
        <View style={[styles.upcomingSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.upcomingSectionTitle, { color: colors.foreground }]}>Next 7 Days</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.upcomingScroll}
            style={{ maxHeight: 140 }}
          >
            {upcomingWorkouts.map((sw, idx) => {
              const workout = SAMPLE_WORKOUTS.find((w) => w.id === sw.workoutId);
              if (!workout) return null;
              const catColor = CATEGORY_COLORS[workout.category];
              const workoutDate = new Date(sw.date + "T12:00:00");
              const dayName = workoutDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              
              return (
                <View key={sw.id} style={[styles.upcomingCard, { backgroundColor: colors.background, borderColor: catColor }]}>
                  <View style={[styles.upcomingCardColor, { backgroundColor: catColor }]} />
                  <View style={styles.upcomingCardContent}>
                    <Text style={[styles.upcomingDate, { color: colors.mutedForeground }]}>{dayName}</Text>
                    <Text style={[styles.upcomingName, { color: colors.foreground }]} numberOfLines={2}>{workout.name}</Text>
                    <Text style={[styles.upcomingMeta, { color: colors.mutedForeground }]}>{workout.durationMinutes}m</Text>
                  </View>
                  <View style={styles.upcomingActions}>
                    <TouchableOpacity 
                      onPress={() => moveWorkoutUp(sw.id)}
                      disabled={idx === 0}
                      style={[styles.moveBtn, { opacity: idx === 0 ? 0.3 : 1 }]}
                    >
                      <Ionicons name="chevron-up" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => moveWorkoutDown(sw.id)}
                      disabled={idx === upcomingWorkouts.length - 1}
                      style={[styles.moveBtn, { opacity: idx === upcomingWorkouts.length - 1 ? 0.3 : 1 }]}
                    >
                      <Ionicons name="chevron-down" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.selectedDateLabel, { color: colors.mutedForeground }]}>
          {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>

        {selectedWorkouts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="calendar-outline" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No workouts scheduled</Text>
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={[styles.addWorkoutBtn, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.addWorkoutText, { color: colors.primary }]}>Add Workouts</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scheduledSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scheduled</Text>
            {selectedWorkouts.map((sw) => {
              const workout = SAMPLE_WORKOUTS.find((w) => w.id === sw.workoutId);
              if (!workout) return null;
              const catColor = CATEGORY_COLORS[workout.category];
              return (
                <View key={sw.id} style={[styles.workoutRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.catBar, { backgroundColor: catColor }]} />
                  <View style={styles.workoutInfo}>
                    <View style={styles.workoutTop}>
                      <Text style={[styles.workoutName, { color: colors.foreground }]}>{workout.name}</Text>
                      <View style={styles.workoutActions}>
                        {sw.completed && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
                        <TouchableOpacity onPress={() => handleRemoveWorkout(sw.id)}>
                          <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={[styles.workoutMeta, { color: colors.mutedForeground }]}>
                      {workout.durationMinutes}m · {workout.calories} cal · {workout.difficulty}
                    </Text>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity onPress={() => setShowAddModal(true)} style={[styles.addMoreBtn, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.addMoreText, { color: colors.primary }]}>Add More</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {showReport && (
        <WeeklyReport
          userStats={userStats}
          scheduledWorkouts={scheduledWorkouts}
          onClose={() => setShowReport(false)}
        />
      )}

      <Modal visible={showYearView} transparent animationType="slide" onRequestClose={() => setShowYearView(false)}>
        <View style={styles.yearOverlay}>
          <View style={[styles.yearSheet, { backgroundColor: colors.background }]}>
            <View style={styles.yearHeader}>
              <View>
                <Text style={[styles.yearTitle, { color: colors.foreground }]}>Full Year Calendar</Text>
                <Text style={[styles.yearSub, { color: colors.mutedForeground }]}>Tap any month to jump there</Text>
              </View>
              <TouchableOpacity onPress={() => setShowYearView(false)} style={[styles.yearClose, { backgroundColor: colors.muted }]}>
                <Ionicons name="close" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.yearContent} showsVerticalScrollIndicator={false}>
              <View style={styles.yearGrid}>
                {yearMonths.map((month) => {
                  const monthDays = scheduledWorkouts.filter((sw) => sw.date.slice(0, 7) === `${new Date().getFullYear()}-${String(month.month + 1).padStart(2, "0")}`);
                  const doneCount = monthDays.filter((sw) => sw.completed).length;
                  return (
                    <TouchableOpacity
                      key={month.month}
                      onPress={() => {
                        const next = new Date(selectedDate);
                        next.setMonth(month.month, 1);
                        setSelectedDate(next.toISOString().split("T")[0]);
                        setShowYearView(false);
                      }}
                      style={[styles.monthCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <Text style={[styles.monthLabel, { color: colors.foreground }]}>{month.label}</Text>
                      <Text style={[styles.monthMeta, { color: colors.mutedForeground }]}>{month.days} days</Text>
                      <View style={[styles.monthPill, { backgroundColor: colors.primary + "18" }]}>
                        <Text style={[styles.monthPillText, { color: colors.primary }]}>
                          {doneCount} done
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add to {selectedDate}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>Select one or more workouts</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
              {SAMPLE_WORKOUTS.map((w) => {
                const isSelected = selectedWorkoutIds.includes(w.id);
                const catColor = CATEGORY_COLORS[w.category];
                return (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => handleToggleWorkoutSelection(w.id)}
                    style={[
                      styles.modalWorkoutRow,
                      { backgroundColor: isSelected ? colors.primary + "20" : "transparent", borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.modalWorkoutLeft}>
                      <View style={[styles.checkbox, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : "transparent" }]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#0D0D0D" />}
                      </View>
                      <View>
                        <Text style={[styles.modalWorkoutName, { color: colors.foreground }]}>{w.name}</Text>
                        <Text style={[styles.modalWorkoutMeta, { color: colors.mutedForeground }]}>
                          {w.durationMinutes}m · +{w.xpReward} XP
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.categoryBadge, { backgroundColor: catColor + "20" }]}>
                      <Text style={[styles.categoryText, { color: catColor }]}>{w.category}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setShowAddModal(false); setSelectedWorkoutIds([]); }} style={[styles.modalBtn, { backgroundColor: colors.muted }]}>
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddMultipleWorkouts}
                disabled={selectedWorkoutIds.length === 0}
                style={[styles.modalBtn, { backgroundColor: selectedWorkoutIds.length > 0 ? colors.primary : colors.muted }]}
              >
                <Text style={[styles.modalBtnText, { color: selectedWorkoutIds.length > 0 ? "#0D0D0D" : colors.mutedForeground }]}>
                  Add ({selectedWorkoutIds.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        style={[styles.fab, { backgroundColor: "#0D0D0D" }]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  yearOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  yearSheet: { maxHeight: "88%", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  yearHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  yearTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  yearSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  yearClose: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  yearContent: { paddingBottom: 8 },
  yearGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  monthCard: { width: "48%", borderRadius: 18, borderWidth: 1, padding: 14, gap: 6 },
  monthMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  monthPill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginTop: 4 },
  monthPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
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
  modalSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 8 },
  modalWorkoutRow: { paddingVertical: 12, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalWorkoutLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  modalWorkoutName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalWorkoutMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  
  headerTop: { gap: 12, marginBottom: 12 },
  monthNav: { flexDirection: "row", alignItems: "center", gap: 12 },
  monthBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  monthLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  
  calendarContainer: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  dayHeaderRow: { flexDirection: "row", borderBottomWidth: 1 },
  dayHeaderCell: { flex: 1, alignItems: "center", paddingVertical: 8 },
  dayHeaderText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarCell: { width: "14.28%", aspectRatio: 1, borderWidth: 1, alignItems: "center", justifyContent: "center", padding: 4 },
  calendarCellDate: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  workoutIndicators: { flexDirection: "row", gap: 2, marginTop: 2, alignItems: "center" },
  indicator: { width: 4, height: 4, borderRadius: 2 },
  moreText: { fontSize: 8, fontFamily: "Inter_600SemiBold", marginLeft: 2 },
  doneIcon: { position: "absolute", top: 2, right: 2 },
  
  scheduledSection: { gap: 12, marginBottom: 16 },
  addMoreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  addMoreText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  workoutActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  
  cancelText: { textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular", paddingTop: 8 },
  fab: { position: "absolute", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
  
  upcomingSection: { marginHorizontal: 20, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 12, paddingTop: 12 },
  upcomingSectionTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 10 },
  upcomingScroll: { paddingRight: 8 },
  upcomingCard: { width: 140, borderRadius: 12, borderWidth: 2, marginRight: 8, overflow: "hidden", paddingTop: 8 },
  upcomingCardColor: { height: 3 },
  upcomingCardContent: { flex: 1, paddingHorizontal: 10, paddingVertical: 6, gap: 2 },
  upcomingDate: { fontSize: 10, fontFamily: "Inter_500Medium" },
  upcomingName: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  upcomingMeta: { fontSize: 9, fontFamily: "Inter_400Regular" },
  upcomingActions: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 6, paddingBottom: 6 },
  moveBtn: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
});
