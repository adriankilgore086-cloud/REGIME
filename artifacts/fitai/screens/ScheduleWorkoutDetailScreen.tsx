import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS, CATEGORY_COLORS } from "@/constants/workouts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getWeekDates(weekOffset = 0) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function ScheduleWorkoutDetail() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { workoutId, scheduledId, date: initialDate } = useLocalSearchParams<{
    workoutId: string; scheduledId?: string; date?: string;
  }>();
  const { scheduleWorkout, scheduledWorkouts, unscheduleWorkout } = useFitness();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const workout = SAMPLE_WORKOUTS.find((w) => w.id === workoutId);
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(initialDate || today);
  const [weekOffset, setWeekOffset] = useState(0);

  if (!workout) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Workout not found</Text>
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[workout.category];
  const weekDates = getWeekDates(weekOffset);
  const isScheduledOnDate = scheduledWorkouts.some(
    (sw) => sw.workoutId === workoutId && sw.date === selectedDate
  );

  const handleToggleDate = async () => {
    const existing = scheduledWorkouts.find(
      (sw) => sw.workoutId === workoutId && sw.date === selectedDate
    );
    if (existing) {
      await unscheduleWorkout(existing.id);
    } else {
      await scheduleWorkout(workoutId, selectedDate);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <LinearGradient
          colors={[catColor + "30", catColor + "08", "transparent"]}
          style={styles.heroGradient}
        >
          <View style={[styles.header, { paddingTop: topPad + 12 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.categoryLabel, { color: catColor }]}>
                {workout.category.toUpperCase()} · {workout.difficulty.toUpperCase()}
              </Text>
              <Text style={[styles.workoutTitle, { color: colors.foreground }]}>{workout.name}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {[
              { icon: "time-outline", label: `${workout.durationMinutes} min` },
              { icon: "flame-outline", label: `${workout.calories} cal` },
              { icon: "flash-outline", label: `+${workout.xpReward} XP` },
            ].map((m) => (
              <View key={m.label} style={[styles.metaChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name={m.icon as any} size={13} color={catColor} />
                <Text style={[styles.metaText, { color: colors.foreground }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Date Selector */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Schedule Date</Text>
          <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.weekNav}>
              <TouchableOpacity onPress={() => setWeekOffset(weekOffset - 1)} style={styles.navBtn}>
                <Ionicons name="chevron-back" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.weekLabel, { color: colors.foreground }]}>
                {MONTHS[weekDates[0].getMonth()]} {weekDates[0].getDate()} – {weekDates[6].getDate()}
              </Text>
              <TouchableOpacity onPress={() => setWeekOffset(weekOffset + 1)} style={styles.navBtn}>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <View style={styles.weekRow}>
              {weekDates.map((d) => {
                const iso = d.toISOString().split("T")[0];
                const isSelected = iso === selectedDate;
                const isToday = iso === today;
                const hasWorkout = scheduledWorkouts.some((sw) => sw.workoutId === workoutId && sw.date === iso);
                return (
                  <TouchableOpacity
                    key={iso}
                    onPress={() => setSelectedDate(iso)}
                    style={[styles.dayCell, isSelected && { backgroundColor: catColor, borderRadius: 10 }]}
                  >
                    <Text style={[styles.dayName, { color: isSelected ? "#0D0D0D" : colors.mutedForeground }]}>
                      {DAYS[d.getDay()].slice(0, 1)}
                    </Text>
                    <Text style={[styles.dayNum, { color: isSelected ? "#0D0D0D" : isToday ? catColor : colors.foreground }]}>
                      {d.getDate()}
                    </Text>
                    {hasWorkout && <View style={[styles.scheduledDot, { backgroundColor: isSelected ? "#0D0D0D" : catColor }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              onPress={handleToggleDate}
              style={[styles.addBtn, { backgroundColor: isScheduledOnDate ? colors.destructive + "20" : catColor }]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isScheduledOnDate ? "trash-outline" : "add"}
                size={18}
                color={isScheduledOnDate ? colors.destructive : "#0D0D0D"}
              />
              <Text style={[styles.addBtnText, { color: isScheduledOnDate ? colors.destructive : "#0D0D0D" }]}>
                {isScheduledOnDate ? "Remove from this date" : "Add to this date"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Muscle Groups */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Target Muscles</Text>
          <View style={styles.muscleWrap}>
            {workout.targetMuscles.map((m) => (
              <View key={m} style={[styles.muscleChip, { backgroundColor: catColor + "18", borderColor: catColor + "40" }]}>
                <Ionicons name="fitness-outline" size={12} color={catColor} />
                <Text style={[styles.muscleText, { color: catColor }]}>{m}</Text>
              </View>
            ))}
          </View>

          {/* Exercises */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Exercises</Text>
          <View style={[styles.exerciseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {workout.exercises.map((ex, i) => (
              <View
                key={ex.id}
                style={[
                  styles.exerciseRow,
                  i < workout.exercises.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.exNum, { backgroundColor: catColor + "20" }]}>
                  <Text style={[styles.exNumText, { color: catColor }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exName, { color: colors.foreground }]}>{ex.name}</Text>
                  <Text style={[styles.exMeta, { color: colors.mutedForeground }]}>
                    {ex.sets} sets × {ex.reps} reps · {ex.restSeconds}s rest
                  </Text>
                </View>
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
  heroGradient: { paddingBottom: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { paddingTop: 2 },
  categoryLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2, marginBottom: 4 },
  workoutTitle: { fontSize: 26, fontFamily: "Poppins_700Bold", letterSpacing: -0.5, lineHeight: 30 },
  metaRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  metaText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 10, marginTop: 6 },
  calendarCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 20 },
  weekNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  navBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  weekLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  dayCell: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 6, marginHorizontal: 2 },
  dayName: { fontSize: 10, fontFamily: "Inter_500Medium" },
  dayNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  scheduledDot: { width: 4, height: 4, borderRadius: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12 },
  addBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  muscleWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  muscleChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  muscleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  exerciseCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden", marginBottom: 20 },
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  exNum: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  exNumText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  exName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  exMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  notFound: { textAlign: "center", marginTop: 40, fontSize: 14, fontFamily: "Inter_400Regular" },
});
