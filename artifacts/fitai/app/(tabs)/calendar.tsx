import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS, CATEGORY_COLORS, WorkoutCategory } from "@/constants/workouts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { scheduledWorkouts, scheduleWorkout } = useFitness();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const weekDates = getWeekDates();
  const today = new Date().toISOString().split("T")[0];

  const getWorkoutsForDate = (date: string) =>
    scheduledWorkouts.filter((sw) => sw.date === date);

  const selectedWorkouts = getWorkoutsForDate(selectedDate);

  const handleAddWorkout = async (workoutId: string) => {
    await scheduleWorkout(workoutId, selectedDate);
    setShowAddModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Schedule</Text>
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={20} color="#08081A" />
        </TouchableOpacity>
      </View>

      <View style={[styles.weekStrip, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {weekDates.map((date) => {
          const iso = date.toISOString().split("T")[0];
          const isToday = iso === today;
          const isSelected = iso === selectedDate;
          const hasWorkout = getWorkoutsForDate(iso).length > 0;

          return (
            <TouchableOpacity
              key={iso}
              onPress={() => setSelectedDate(iso)}
              style={styles.dayCell}
            >
              <Text style={[styles.dayName, { color: isSelected ? colors.primary : colors.mutedForeground }]}>
                {DAYS[date.getDay()]}
              </Text>
              <View style={[
                styles.dayNum,
                isSelected && { backgroundColor: colors.primary },
                isToday && !isSelected && { borderWidth: 1, borderColor: colors.primary },
              ]}>
                <Text style={[
                  styles.dayNumText,
                  { color: isSelected ? "#08081A" : isToday ? colors.primary : colors.foreground }
                ]}>
                  {date.getDate()}
                </Text>
              </View>
              {hasWorkout && (
                <View style={[styles.dotIndicator, { backgroundColor: isSelected ? colors.primary : colors.mutedForeground }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

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

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>Workout Library</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  addBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  weekStrip: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  dayCell: { flex: 1, alignItems: "center", gap: 6 },
  dayName: { fontSize: 10, fontFamily: "Inter_500Medium" },
  dayNum: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dayNumText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dotIndicator: { width: 4, height: 4, borderRadius: 2 },
  content: { paddingHorizontal: 20, paddingTop: 16 },
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
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3, marginBottom: 4 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 14 },
  libraryRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  libraryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  libraryInfo: { flex: 1 },
  libraryName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  libraryMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  xpChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  xpText: { fontSize: 11, fontFamily: "Inter_700Bold" },
});
