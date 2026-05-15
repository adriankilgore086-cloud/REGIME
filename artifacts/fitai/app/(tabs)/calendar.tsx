import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  PanResponder,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS, CATEGORY_COLORS } from "@/constants/workouts";
import { WorkoutPlayerModal } from "@/components/WorkoutPlayerModal";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_SWIPE_THRESHOLD = 40;

function getWeekDates(weekOffset = 0) {
  const today = new Date();
  const week = [];
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    week.push(d);
  }
  return week;
}

function shiftIsoDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function WeeklyReport({
  userStats,
  scheduledWorkouts,
  onClose,
}: {
  userStats: any;
  scheduledWorkouts: any[];
  onClose: () => void;
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

  const MUSCLE_FOCUS = [
    "Chest",
    "Back",
    "Shoulders",
    "Triceps",
    "Core",
    "Legs",
  ];

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
              <Text style={[rStyles.headerSub, { color: colors.primary }]}>
                WEEKLY RECAP
              </Text>
              <Text style={[rStyles.headerTitle, { color: colors.foreground }]}>
                Week in Review
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[rStyles.closeBtn, { backgroundColor: colors.muted }]}
            >
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={rStyles.content}
          >
            <View style={rStyles.statsRow}>
              {[
                {
                  label: "Workouts",
                  value: weeklyStats.completed.toString(),
                  icon: "barbell-outline",
                  color: colors.primary,
                },
                {
                  label: "Calories",
                  value: weeklyStats.calories.toLocaleString(),
                  icon: "flame-outline",
                  color: "#FF2D78",
                },
                {
                  label: "Minutes",
                  value: weeklyStats.minutes.toString(),
                  icon: "time-outline",
                  color: colors.success,
                },
                {
                  label: "XP Earned",
                  value: `+${weeklyStats.xpEarned}`,
                  icon: "flash-outline",
                  color: "#A78BFA",
                },
              ].map((s) => (
                <View
                  key={s.label}
                  style={[
                    rStyles.statBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: s.color + "30",
                    },
                  ]}
                >
                  <Ionicons name={s.icon as any} size={16} color={s.color} />
                  <Text style={[rStyles.statVal, { color: s.color }]}>
                    {s.value}
                  </Text>
                  <Text
                    style={[
                      rStyles.statLabel,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={[
                rStyles.consistencyCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={rStyles.consistencyHeader}>
                <Text style={[rStyles.cardTitle, { color: colors.foreground }]}>
                  Consistency Score
                </Text>
                <Text
                  style={[
                    rStyles.consistencyPct,
                    {
                      color:
                        consistencyPct >= 70
                          ? colors.success
                          : consistencyPct >= 40
                            ? "#F3D27A"
                            : colors.accent,
                    },
                  ]}
                >
                  {consistencyPct}%
                </Text>
              </View>
              <View style={rStyles.weekGrid}>
                {DAYS.map((day, i) => {
                  const d = new Date(weekStart);
                  d.setDate(weekStart.getDate() + i);
                  const iso = d.toISOString().split("T")[0];
                  const done = scheduledWorkouts.some(
                    (sw) => sw.date === iso && sw.completed,
                  );
                  const skipped = scheduledWorkouts.some(
                    (sw) => sw.date === iso && sw.skipped,
                  );
                  return (
                    <View key={day} style={rStyles.dayCell}>
                      <Text
                        style={[
                          rStyles.dayName,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {day.slice(0, 1)}
                      </Text>
                      <View
                        style={[
                          rStyles.dayDot,
                          done && { backgroundColor: colors.success },
                          skipped && { backgroundColor: colors.destructive },
                          !done &&
                            !skipped && { backgroundColor: colors.muted },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
              <View style={rStyles.legendRow}>
                <View style={rStyles.legendItem}>
                  <View
                    style={[
                      rStyles.legendDot,
                      { backgroundColor: colors.success },
                    ]}
                  />
                  <Text
                    style={[
                      rStyles.legendText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Done
                  </Text>
                </View>
                <View style={rStyles.legendItem}>
                  <View
                    style={[
                      rStyles.legendDot,
                      { backgroundColor: colors.destructive },
                    ]}
                  />
                  <Text
                    style={[
                      rStyles.legendText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Skipped
                  </Text>
                </View>
                <View style={rStyles.legendItem}>
                  <View
                    style={[
                      rStyles.legendDot,
                      { backgroundColor: colors.muted },
                    ]}
                  />
                  <Text
                    style={[
                      rStyles.legendText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Rest
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                rStyles.muscleCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[rStyles.cardTitle, { color: colors.foreground }]}>
                Muscle Groups Trained
              </Text>
              <View style={rStyles.muscleTags}>
                {MUSCLE_FOCUS.map((m, i) => (
                  <View
                    key={m}
                    style={[
                      rStyles.muscleChip,
                      {
                        backgroundColor:
                          i < 4 ? colors.primary + "20" : colors.muted,
                        borderColor:
                          i < 4 ? colors.primary + "40" : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        rStyles.muscleText,
                        {
                          color:
                            i < 4 ? colors.primary : colors.mutedForeground,
                        },
                      ]}
                    >
                      {m}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View
              style={[
                rStyles.aiCard,
                { backgroundColor: "#8FB8FF08", borderColor: "#8FB8FF25" },
              ]}
            >
              <View style={rStyles.aiHeader}>
                <LinearGradient
                  colors={["#8FB8FF", "#6B9EFF"]}
                  style={rStyles.aiAvatarGrad}
                >
                  <Ionicons name="sparkles" size={14} color="#0D0D0D" />
                </LinearGradient>
                <Text style={[rStyles.aiLabel, { color: colors.primary }]}>
                  AI Coach Analysis
                </Text>
              </View>
              {AI_INSIGHTS.map((insight, i) => (
                <View key={i} style={rStyles.insightRow}>
                  <View
                    style={[
                      rStyles.insightDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <Text
                    style={[rStyles.insightText, { color: colors.foreground }]}
                  >
                    {insight}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={[
                rStyles.streakCard,
                { backgroundColor: "#F3D27A12", borderColor: "#F3D27A30" },
              ]}
            >
              <View style={rStyles.streakInner}>
                <Ionicons name="flame" size={28} color="#F3D27A" />
                <View>
                  <Text style={[rStyles.streakNum, { color: "#F3D27A" }]}>
                    {userStats.streak} day streak
                  </Text>
                  <Text
                    style={[
                      rStyles.streakSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {userStats.streak >= 7
                      ? "You're on fire. Don't stop now."
                      : "Keep it going — every day counts."}
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "90%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  gradient: { position: "absolute", top: 0, left: 0, right: 0, height: 180 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF25",
    alignSelf: "center",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  statVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  consistencyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  consistencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
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
  muscleCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  muscleTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  muscleChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  muscleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  aiCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  aiAvatarGrad: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  aiLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  insightRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  insightDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7 },
  insightText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  streakCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  streakInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  streakNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
  streakSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function AddWorkoutModal({
  visible,
  selectedDate,
  onSelectDate,
  weekDates,
  weekOffset,
  onWeekOffsetChange,
  scheduledWorkouts,
  onAdd,
  onRemove,
  onClose,
}: {
  visible: boolean;
  selectedDate: string;
  onSelectDate: (d: string) => void;
  weekDates: Date[];
  weekOffset: number;
  onWeekOffsetChange: (o: number) => void;
  scheduledWorkouts: any[];
  onAdd: (workoutId: string) => void;
  onRemove: (scheduledId: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const today = new Date().toISOString().split("T")[0];
  const [search, setSearch] = useState("");

  const filteredWorkouts = SAMPLE_WORKOUTS.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={mStyles.overlay}>
        <View style={[mStyles.sheet, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={["#8FB8FF10", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={mStyles.handle} />

          <View style={mStyles.header}>
            <View>
              <Text style={[mStyles.sub, { color: colors.primary }]}>
                SCHEDULE
              </Text>
              <Text style={[mStyles.title, { color: colors.foreground }]}>
                Add Workout
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[mStyles.closeBtn, { backgroundColor: colors.muted }]}
            >
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Date Selector */}
          <View
            style={[
              mStyles.calCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={mStyles.calNav}>
              <TouchableOpacity
                onPress={() => onWeekOffsetChange(weekOffset - 1)}
                style={mStyles.navBtn}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
              <Text style={[mStyles.calLabel, { color: colors.foreground }]}>
                {MONTHS_SHORT[weekDates[0].getMonth()]} {weekDates[0].getDate()}{" "}
                – {weekDates[6].getDate()}
              </Text>
              <TouchableOpacity
                onPress={() => onWeekOffsetChange(weekOffset + 1)}
                style={mStyles.navBtn}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
            <View style={mStyles.weekRow}>
              {weekDates.map((d) => {
                const iso = d.toISOString().split("T")[0];
                const isSel = iso === selectedDate;
                const isToday = iso === today;
                const count = scheduledWorkouts.filter(
                  (sw) => sw.date === iso,
                ).length;
                return (
                  <TouchableOpacity
                    key={iso}
                    onPress={() => onSelectDate(iso)}
                    style={[
                      mStyles.calDay,
                      isSel && {
                        backgroundColor: colors.primary,
                        borderRadius: 10,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        mStyles.calDayName,
                        { color: isSel ? "#0D0D0D" : colors.mutedForeground },
                      ]}
                    >
                      {DAYS[d.getDay()].slice(0, 1)}
                    </Text>
                    <Text
                      style={[
                        mStyles.calDayNum,
                        {
                          color: isSel
                            ? "#0D0D0D"
                            : isToday
                              ? colors.primary
                              : colors.foreground,
                        },
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                    {count > 0 && (
                      <View
                        style={[
                          mStyles.calDot,
                          {
                            backgroundColor: isSel ? "#0D0D0D" : colors.primary,
                          },
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Search */}
          <View
            style={[
              mStyles.searchRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[mStyles.searchInput, { color: colors.foreground }]}
              placeholder="Search workouts..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Workout List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 320 }}
          >
            {filteredWorkouts.map((w) => {
              const catColor = CATEGORY_COLORS[w.category];
              const scheduled = scheduledWorkouts.find(
                (sw) => sw.workoutId === w.id && sw.date === selectedDate,
              );
              return (
                <TouchableOpacity
                  key={w.id}
                  onPress={() =>
                    scheduled ? onRemove(scheduled.id) : onAdd(w.id)
                  }
                  style={[
                    mStyles.workoutRow,
                    {
                      borderColor: scheduled ? catColor + "50" : colors.border,
                      backgroundColor: scheduled
                        ? catColor + "12"
                        : "transparent",
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      mStyles.iconWrap,
                      { backgroundColor: catColor + "20" },
                    ]}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={16}
                      color={catColor}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[mStyles.wName, { color: colors.foreground }]}>
                      {w.name}
                    </Text>
                    <Text
                      style={[mStyles.wMeta, { color: colors.mutedForeground }]}
                    >
                      {w.durationMinutes}m · {w.category} · +{w.xpReward} XP
                    </Text>
                  </View>
                  <View
                    style={[
                      mStyles.addChip,
                      {
                        backgroundColor: scheduled
                          ? catColor + "20"
                          : colors.primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={scheduled ? "checkmark" : "add"}
                      size={16}
                      color={scheduled ? catColor : "#0D0D0D"}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
            {filteredWorkouts.length === 0 && (
              <Text
                style={[mStyles.noResults, { color: colors.mutedForeground }]}
              >
                No workouts found
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    paddingBottom: 30,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF25",
    alignSelf: "center",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  calCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  calNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  navBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  calLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  calDay: { flex: 1, alignItems: "center", gap: 3, paddingVertical: 6 },
  calDayName: { fontSize: 10, fontFamily: "Inter_500Medium" },
  calDayNum: { fontSize: 13, fontFamily: "Inter_700Bold" },
  calDot: { width: 4, height: 4, borderRadius: 2 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  wName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  wMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  addChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  noResults: {
    textAlign: "center",
    paddingVertical: 24,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});

export default function CalendarScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    scheduledWorkouts,
    scheduleWorkout,
    userStats,
    unscheduleWorkout,
    completeWorkout,
  } = useFitness();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [longPressedWorkout, setLongPressedWorkout] = useState<string | null>(
    null,
  );
  const [playerWorkout, setPlayerWorkout] = useState<
    import("@/constants/workouts").Workout | null
  >(null);
  const [playerScheduledId, setPlayerScheduledId] = useState<string | null>(
    null,
  );
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const openPlayer = (
    workout: import("@/constants/workouts").Workout,
    scheduledId: string,
  ) => {
    setPlayerWorkout(workout);
    setPlayerScheduledId(scheduledId);
  };

  const closePlayer = () => {
    setPlayerWorkout(null);
    setPlayerScheduledId(null);
  };

  const weekDates = getWeekDates(weekOffset);
  const today = new Date().toISOString().split("T")[0];

  const getWorkoutsForDate = (date: string) =>
    scheduledWorkouts.filter((sw) => sw.date === date);
  const selectedWorkouts = getWorkoutsForDate(selectedDate);

  const weekCompleted = weekDates.filter((d) => {
    const iso = d.toISOString().split("T")[0];
    return scheduledWorkouts.some((sw) => sw.date === iso && sw.completed);
  }).length;

  const handleAddWorkout = async (workoutId: string) => {
    await scheduleWorkout(workoutId, selectedDate);
    setShowAddModal(false);
  };

  const navigateWeek = useCallback((direction: -1 | 1) => {
    setWeekOffset((current) => current + direction);
    setSelectedDate((current) => shiftIsoDate(current, direction * 7));
  }, []);

  const weekStripPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > WEEK_SWIPE_THRESHOLD &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          Math.abs(gestureState.dx) > WEEK_SWIPE_THRESHOLD &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dx) < WEEK_SWIPE_THRESHOLD) return;
          if (gestureState.dx < 0) navigateWeek(1);
          if (gestureState.dx > 0) navigateWeek(-1);
        },
      }),
    [navigateWeek],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#FFFFFF18", "#FFFFFF08", "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: topPad + 90,
        }}
        pointerEvents="none"
      />
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.background },
        ]}
      >
        <Text
          style={[styles.title, { color: colors.foreground, fontSize: 29.7 }]}
        >
          Schedule
        </Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            onPress={() => setShowReport(true)}
            style={[
              styles.reportBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="bar-chart-outline"
              size={15}
              color={colors.primary}
            />
            <Text style={[styles.reportBtnText, { color: colors.primary }]}>
              Week Report
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color="#0D0D0D" />
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.weekStrip,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
        {...weekStripPanResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={() => navigateWeek(-1)}
          style={styles.weekNavBtn}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
        <View style={styles.weekDaysRow}>
          {weekDates.map((date) => {
            const iso = date.toISOString().split("T")[0];
            const isToday = iso === today;
            const isSelected = iso === selectedDate;
            const hasWorkout = getWorkoutsForDate(iso).length > 0;
            const done = scheduledWorkouts.some(
              (sw) => sw.date === iso && sw.completed,
            );
            return (
              <TouchableOpacity
                key={iso}
                onPress={() => setSelectedDate(iso)}
                style={styles.dayCell}
              >
                <Text
                  style={[
                    styles.dayName,
                    {
                      color: isSelected
                        ? colors.primary
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  {DAYS[date.getDay()]}
                </Text>
                <View
                  style={[
                    styles.dayNum,
                    isSelected && { backgroundColor: colors.primary },
                    isToday &&
                      !isSelected && {
                        borderWidth: 1,
                        borderColor: colors.primary,
                      },
                    done &&
                      !isSelected && {
                        borderWidth: 1,
                        borderColor: colors.success + "60",
                      },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumText,
                      {
                        color: isSelected
                          ? "#0D0D0D"
                          : isToday
                            ? colors.primary
                            : done
                              ? colors.success
                              : colors.foreground,
                      },
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
                {hasWorkout && !done && (
                  <View
                    style={[
                      styles.dotIndicator,
                      {
                        backgroundColor: isSelected
                          ? "#0D0D0D"
                          : colors.mutedForeground,
                      },
                    ]}
                  />
                )}
                {done && (
                  <Ionicons name="checkmark" size={10} color={colors.success} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          onPress={() => navigateWeek(1)}
          style={styles.weekNavBtn}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 190 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Regime Banner — only when today has workouts */}
        {selectedDate === today && selectedWorkouts.length > 0 && (
          <View
            style={[
              styles.regimeBanner,
              { borderColor: colors.primary + "40" },
            ]}
          >
            <LinearGradient
              colors={[
                colors.primary + "18",
                colors.primary + "08",
                "transparent",
              ]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.regimeBannerTitle, { color: colors.primary }]}
              >
                Today's Regime!
              </Text>
              <Text
                style={[styles.regimeBannerDate, { color: colors.foreground }]}
              >
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "long", month: "long", day: "numeric" },
                )}
              </Text>
            </View>
            <Ionicons name="flash" size={24} color={colors.primary} />
          </View>
        )}

        {selectedDate !== today && (
          <View style={styles.regimeHeader}>
            <Text style={[styles.regimeTitle, { color: colors.foreground }]}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric" },
              )}
            </Text>
          </View>
        )}

        {selectedWorkouts.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={32}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No workouts scheduled
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              style={[
                styles.addWorkoutBtn,
                {
                  backgroundColor: colors.primary + "20",
                  borderColor: colors.primary + "40",
                },
              ]}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.addWorkoutText, { color: colors.primary }]}>
                Add Workout
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.workoutGrid}>
            {selectedWorkouts.map((sw) => {
              const workout = SAMPLE_WORKOUTS.find(
                (w) => w.id === sw.workoutId,
              );
              if (!workout) return null;
              const catColor = CATEGORY_COLORS[workout.category];
              const isPressed = longPressedWorkout === sw.id;
              return (
                <TouchableOpacity
                  key={sw.id}
                  onPress={() =>
                    !isPressed &&
                    router.push(
                      `/schedule-workout-detail?workoutId=${workout.id}&scheduledId=${sw.id}&date=${selectedDate}` as any,
                    )
                  }
                  onLongPress={() => setLongPressedWorkout(sw.id)}
                  delayLongPress={500}
                  style={[
                    styles.workoutCard,
                    {
                      borderColor: isPressed
                        ? colors.destructive
                        : catColor + "40",
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#2A2A2A", "#1A1A1A"]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View
                    style={[
                      styles.cardIconWrap,
                      { backgroundColor: catColor + "25" },
                    ]}
                  >
                    <Ionicons
                      name="barbell-outline"
                      size={20}
                      color={"#FFFFFF"}
                    />
                    {sw.completed && (
                      <View
                        style={[
                          styles.completeBadge,
                          { backgroundColor: colors.success },
                        ]}
                      >
                        <Ionicons name="checkmark" size={8} color="#FFF" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardName} numberOfLines={2}>
                    {workout.name}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {workout.durationMinutes}m · {workout.difficulty}
                  </Text>
                  <View style={styles.cardMuscleRow}>
                    {workout.targetMuscles.slice(0, 2).map((m) => (
                      <View
                        key={m}
                        style={[
                          styles.cardChip,
                          { backgroundColor: catColor + "20" },
                        ]}
                      >
                        <Text
                          style={[styles.cardChipText, { color: catColor }]}
                        >
                          {m}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {isPressed && (
                    <TouchableOpacity
                      onPress={() => {
                        unscheduleWorkout(sw.id);
                        setLongPressedWorkout(null);
                      }}
                      style={styles.deleteOverlay}
                    >
                      <Ionicons name="trash" size={20} color="#FFF" />
                      <Text style={styles.deleteText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
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

      <AddWorkoutModal
        visible={showAddModal}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        weekDates={weekDates}
        weekOffset={weekOffset}
        onWeekOffsetChange={setWeekOffset}
        scheduledWorkouts={scheduledWorkouts}
        onAdd={handleAddWorkout}
        onRemove={(id) => unscheduleWorkout(id)}
        onClose={() => setShowAddModal(false)}
      />

      {playerWorkout && (
        <WorkoutPlayerModal
          visible={!!playerWorkout}
          workout={playerWorkout}
          scheduledId={playerScheduledId}
          onClose={closePlayer}
          onComplete={(sid) => {
            completeWorkout(sid);
            closePlayer();
          }}
        />
      )}

      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        style={[
          styles.libraryBtn,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            bottom: insets.bottom + 76,
          },
        ]}
        activeOpacity={0.9}
      >
        <Ionicons name="library-outline" size={16} color={colors.primary} />
        <Text style={[styles.libraryBtnText, { color: colors.foreground }]}>
          Workout Library
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 27, fontFamily: "Poppins_700Bold", letterSpacing: -0.5 },
  headerBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  reportBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  weekStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  weekNavBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDaysRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  dayCell: { alignItems: "center", gap: 5, flex: 1 },
  dayName: { fontSize: 10, fontFamily: "Inter_500Medium" },
  dayNum: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dotIndicator: { width: 4, height: 4, borderRadius: 2 },
  content: { paddingHorizontal: 16, paddingTop: 14 },
  regimeBanner: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    overflow: "hidden",
  },
  regimeBannerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    letterSpacing: -0.3,
  },
  regimeBannerDate: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  regimeHeader: { marginBottom: 10 },
  regimeTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  addWorkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  addWorkoutText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  workoutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  workoutCard: {
    width: "48%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
    gap: 6,
    minHeight: 140,
  },
  cardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  completeBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 18,
  },
  cardMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF80",
  },
  cardMuscleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  cardChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  cardChipText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  deleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(220,38,38,0.88)",
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  } as any,
  deleteText: { color: "#FFF", fontSize: 12, fontFamily: "Inter_700Bold" },
  libraryBtn: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  libraryBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  cancelText: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
