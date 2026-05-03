import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS, CATEGORY_COLORS } from "@/constants/workouts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    xpEarned: weekWorkouts.reduce((sum, sw) => {
      const w = SAMPLE_WORKOUTS.find((x) => x.id === sw.workoutId);
      return sum + (w?.xpReward ?? 0);
    }, 0),
    streak: userStats.streak,
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={[rStyles.overlay, { backgroundColor: colors.background + "CC" }]}>
        <View style={[rStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[rStyles.header, { borderBottomColor: colors.border }]}>
            <Text style={[rStyles.title, { color: colors.foreground }]}>This Week</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={rStyles.content} showsVerticalScrollIndicator={false}>
            <View style={[rStyles.statRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={rStyles.statItem}>
                <Text style={[rStyles.statVal, { color: colors.primary }]}>{weeklyStats.completed}</Text>
                <Text style={[rStyles.statLabel, { color: colors.mutedForeground }]}>Completed</Text>
              </View>
              <View style={rStyles.statItem}>
                <Text style={[rStyles.statVal, { color: "#FF2D78" }]}>+{weeklyStats.xpEarned}</Text>
                <Text style={[rStyles.statLabel, { color: colors.mutedForeground }]}>XP Earned</Text>
              </View>
              <View style={rStyles.statItem}>
                <Text style={[rStyles.statVal, { color: "#F3D27A" }]}>{weeklyStats.streak}d</Text>
                <Text style={[rStyles.statLabel, { color: colors.mutedForeground }]}>Streak</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const rStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  statRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, paddingVertical: 20, paddingHorizontal: 16, justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statVal: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
});

function AddWorkoutModal({ visible, onClose, onAdd }: {
  visible: boolean; onClose: () => void; onAdd: (date: string, workoutId: string) => void;
}) {
  const colors = useColors();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);

  const handleAdd = () => {
    if (selectedDate && selectedWorkout) {
      onAdd(selectedDate, selectedWorkout);
      setSelectedDate(null);
      setSelectedWorkout(null);
      onClose();
    }
  };

  const nextWeek = getWeekDates(0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[aStyles.overlay, { backgroundColor: colors.background + "CC" }]}>
        <View style={[aStyles.sheet, { backgroundColor: colors.background }]}>
          <View style={[aStyles.header, { borderBottomColor: colors.border }]}>
            <Text style={[aStyles.title, { color: colors.foreground }]}>Add Workout</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={aStyles.content} showsVerticalScrollIndicator={false}>
            <Text style={[aStyles.label, { color: colors.foreground }]}>Select Date</Text>
            <View style={aStyles.dateRow}>
              {nextWeek.map((date) => {
                const dateStr = date.toISOString().split("T")[0];
                const isSelected = selectedDate === dateStr;
                return (
                  <TouchableOpacity
                    key={dateStr}
                    onPress={() => setSelectedDate(dateStr)}
                    style={[
                      aStyles.dateBtn,
                      { backgroundColor: isSelected ? colors.primary : colors.card, borderColor: colors.border }
                    ]}
                  >
                    <Text style={[aStyles.dayLabel, { color: isSelected ? "#0D0D0D" : colors.mutedForeground }]}>
                      {DAYS[date.getDay()]}
                    </Text>
                    <Text style={[aStyles.dayNum, { color: isSelected ? "#0D0D0D" : colors.foreground }]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[aStyles.label, { color: colors.foreground, marginTop: 20 }]}>Select Workout</Text>
            {SAMPLE_WORKOUTS.map((workout) => {
              const isSelected = selectedWorkout === workout.id;
              const catColor = CATEGORY_COLORS[workout.category as keyof typeof CATEGORY_COLORS] || "#888";
              return (
                <TouchableOpacity
                  key={workout.id}
                  onPress={() => setSelectedWorkout(workout.id)}
                  style={[
                    aStyles.workoutBtn,
                    { backgroundColor: isSelected ? colors.primary + "30" : colors.card, borderColor: isSelected ? colors.primary : colors.border }
                  ]}
                >
                  <View style={[aStyles.wIcon, { backgroundColor: catColor + "30" }]}>
                    <Ionicons name="barbell" size={16} color={catColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[aStyles.wName, { color: colors.foreground }]}>{workout.name}</Text>
                    <Text style={[aStyles.wMeta, { color: colors.mutedForeground }]}>
                      {workout.durationMinutes}m · {workout.category}
                    </Text>
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[aStyles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={[aStyles.cancelBtn, { backgroundColor: colors.muted }]}>
              <Text style={[aStyles.cancelText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!selectedDate || !selectedWorkout}
              style={[
                aStyles.addBtn,
                { backgroundColor: selectedDate && selectedWorkout ? colors.primary : colors.muted }
              ]}
            >
              <Text style={[aStyles.addText, { color: selectedDate && selectedWorkout ? "#0D0D0D" : colors.mutedForeground }]}>
                Add Workout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const aStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  dateRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  dateBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  dayLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  dayNum: { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 2 },
  workoutBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8, gap: 10 },
  wIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  wName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  wMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  cancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  addBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  addText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});

function LibraryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[libStyles.overlay, { backgroundColor: colors.background }]}>
        <View style={[libStyles.header, { borderBottomColor: colors.border }]}>
          <Text style={[libStyles.title, { color: colors.foreground }]}>Workout Library</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={SAMPLE_WORKOUTS}
          keyExtractor={(w) => w.id}
          contentContainerStyle={libStyles.content}
          renderItem={({ item: workout }) => {
            const catColor = CATEGORY_COLORS[workout.category as keyof typeof CATEGORY_COLORS] || "#888";
            return (
              <View style={[libStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[libStyles.icon, { backgroundColor: catColor + "30" }]}>
                  <Ionicons name="barbell" size={20} color={catColor} />
                </View>
                <View style={libStyles.info}>
                  <Text style={[libStyles.name, { color: colors.foreground }]}>{workout.name}</Text>
                  <Text style={[libStyles.meta, { color: colors.mutedForeground }]}>
                    {workout.durationMinutes}m · {workout.calories} cal · {workout.category}
                  </Text>
                  <View style={libStyles.tags}>
                    {workout.targetMuscles.map((m: string) => (
                      <View key={m} style={[libStyles.tag, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
                        <Text style={[libStyles.tagText, { color: colors.primary }]}>{m}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={[libStyles.xp, { color: colors.primary }]}>+{workout.xpReward}</Text>
              </View>
            );
          }}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

const libStyles = StyleSheet.create({
  overlay: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  card: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  name: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  meta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  tagText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  xp: { fontSize: 12, fontFamily: "Inter_700Bold" },
});

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userStats, scheduledWorkouts, scheduleWorkout } = useFitness();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showWeekly, setShowWeekly] = useState(false);
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const week = getWeekDates(weekOffset);
  const dayWorkouts = scheduledWorkouts.filter((sw) => sw.date === selectedDate);
  const selectedDateObj = new Date(selectedDate);
  const dayName = DAYS[selectedDateObj.getDay()];

  const handleAddWorkout = (date: string, workoutId: string) => {
    scheduleWorkout(workoutId, date);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Schedule</Text>
        <View style={styles.topButtons}>
          <TouchableOpacity onPress={() => setShowWeekly(true)} style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="bar-chart" size={14} color={colors.primary} />
            <Text style={[styles.headerBtnText, { color: colors.foreground }]}>Week Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAddWorkout(true)}
            style={[styles.fabSmall, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color="#0D0D0D" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: colors.primary }]}>0 / 5</Text>
            <Text style={[styles.statText, { color: colors.mutedForeground }]}>This Week</Text>
          </View>
          <Text style={[styles.statHint, { color: colors.mutedForeground }]}>Let's get started</Text>
          <TouchableOpacity onPress={() => setShowWeekly(true)}>
            <Text style={[styles.viewMore, { color: colors.primary }]}>View →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekScroller}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekRow}>
            {week.map((date) => {
              const dateStr = date.toISOString().split("T")[0];
              const isSelected = dateStr === selectedDate;
              return (
                <TouchableOpacity
                  key={dateStr}
                  onPress={() => setSelectedDate(dateStr)}
                  style={[
                    styles.dayCell,
                    { backgroundColor: isSelected ? colors.primary : colors.card, borderColor: colors.border }
                  ]}
                >
                  <Text style={[styles.dayName, { color: isSelected ? "#0D0D0D" : colors.mutedForeground }]}>
                    {DAYS[date.getDay()]}
                  </Text>
                  <Text style={[styles.dayDate, { color: isSelected ? "#0D0D0D" : colors.foreground }]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.weekNav}>
            <TouchableOpacity onPress={() => setWeekOffset(weekOffset - 1)}>
              <Ionicons name="chevron-back" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setWeekOffset(weekOffset + 1)}>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.selectedDaySection}>
          <View style={[styles.dayHeader, { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 2 }]}>
            <Text style={[styles.dayTitle, { color: colors.foreground }]}>{dayName}</Text>
            <Text style={[styles.daySubtitle, { color: colors.mutedForeground }]}>
              {selectedDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          </View>

          <ScrollView
            style={styles.workoutsList}
            contentContainerStyle={styles.workoutsContent}
            showsVerticalScrollIndicator={false}
          >
            {dayWorkouts.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="barbell-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No workouts scheduled</Text>
              </View>
            ) : (
              dayWorkouts.map((sw) => {
                const workout = SAMPLE_WORKOUTS.find((w) => w.id === sw.workoutId);
                if (!workout) return null;
                const catColor = CATEGORY_COLORS[workout.category as keyof typeof CATEGORY_COLORS] || "#888";
                return (
                  <View key={sw.id} style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.wIcon, { backgroundColor: catColor + "30" }]}>
                      <Ionicons name="barbell" size={18} color={catColor} />
                    </View>
                    <View style={styles.wInfo}>
                      <Text style={[styles.wName, { color: colors.foreground }]}>{workout.name}</Text>
                      <Text style={[styles.wMeta, { color: colors.mutedForeground }]}>
                        {workout.durationMinutes}m · {workout.calories} cal · {workout.category}
                      </Text>
                    </View>
                    <Text style={[styles.wXP, { color: colors.primary }]}>+{workout.xpReward}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={() => setShowLibrary(true)}
            style={[styles.libraryBtn, { backgroundColor: "#1A1A1A", borderColor: colors.border }]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.libraryBtnText}>Library</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showWeekly && (
        <WeeklyReport
          userStats={userStats}
          scheduledWorkouts={scheduledWorkouts}
          onClose={() => setShowWeekly(false)}
        />
      )}
      <AddWorkoutModal visible={showAddWorkout} onClose={() => setShowAddWorkout(false)} onAdd={handleAddWorkout} />
      <LibraryModal visible={showLibrary} onClose={() => setShowLibrary(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  topButtons: { flexDirection: "row", gap: 10, alignItems: "center" },
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  headerBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  fabSmall: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  statsCard: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  statBox: { width: 60 },
  statNum: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statText: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  statHint: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  viewMore: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  weekScroller: { marginBottom: 20, position: "relative" },
  weekRow: { flexDirection: "row", gap: 8, paddingRight: 20 },
  dayCell: { width: 50, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  dayName: { fontSize: 10, fontFamily: "Inter_500Medium" },
  dayDate: { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 2 },
  weekNav: { flexDirection: "row", gap: 10, position: "absolute", right: 0, top: 0, paddingRight: 20 },
  selectedDaySection: { flex: 1, minHeight: 400 },
  dayHeader: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  dayTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  daySubtitle: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  workoutsList: { maxHeight: 300, marginBottom: 12 },
  workoutsContent: { gap: 10 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyText: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 8 },
  workoutCard: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, gap: 10 },
  wIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  wInfo: { flex: 1 },
  wName: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  wMeta: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  wXP: { fontSize: 11, fontFamily: "Inter_700Bold" },
  libraryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  libraryBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
});
