import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, TextInput, PanResponder, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";

const AI_PLAN_WEEKS = [
  {
    week: 1, label: "Foundation",
    workouts: ["Bench Press 3×8", "Squats 3×10", "Rows 3×10"],
    focus: "Build movement patterns & baseline strength",
  },
  {
    week: 2, label: "Volume",
    workouts: ["Incline Press 4×8", "Leg Press 4×10", "Pull-ups 3×8"],
    focus: "Increase volume with progressive overload",
  },
  {
    week: 3, label: "Intensity",
    workouts: ["Bench 5×5", "Deadlift 4×5", "OHP 4×6"],
    focus: "Build peak strength with heavy compound lifts",
  },
  {
    week: 4, label: "Deload",
    workouts: ["Light Cardio", "Mobility Work", "Recovery Session"],
    focus: "Active recovery to consolidate gains",
  },
];

const PURPOSE_CHIPS = ["Strength", "Endurance", "Weight Loss", "Muscle Gain", "Flexibility", "Other"];
const DURATION_CHIPS = ["7", "14", "30", "60", "90"];

function StreakCalendar() {
  const colors = useColors();
  const { scheduledWorkouts, userStats } = useFitness();

  const completedDates = useMemo(() => {
    const set = new Set<string>();
    scheduledWorkouts.forEach((sw) => { if (sw.completed) set.add(sw.date); });
    return set;
  }, [scheduledWorkouts]);

  const today = new Date();
  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
  const WEEKS = 6;
  const totalDays = WEEKS * 7;

  const cells = useMemo(() => {
    const arr: { iso: string; done: boolean; isToday: boolean; future: boolean }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const todayIso = today.toISOString().split("T")[0];
      arr.push({
        iso,
        done: completedDates.has(iso),
        isToday: iso === todayIso,
        future: iso > todayIso,
      });
    }
    return arr;
  }, [completedDates]);

  const byWeek: typeof cells[] = [];
  for (let w = 0; w < WEEKS; w++) byWeek.push(cells.slice(w * 7, w * 7 + 7));
  const doneCount = cells.filter((c) => c.done).length;

  return (
    <View style={[scStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={scStyles.header}>
        <View>
          <Text style={[scStyles.title, { color: colors.foreground }]}>Consistency Tracker</Text>
          <Text style={[scStyles.sub, { color: colors.mutedForeground }]}>{doneCount} sessions · {WEEKS} weeks · {userStats.streak}d streak</Text>
        </View>
        <View style={[scStyles.streakPill, { backgroundColor: "#F3D27A18", borderColor: "#F3D27A35" }]}>
          <Ionicons name="flame" size={13} color="#F3D27A" />
          <Text style={[scStyles.streakText, { color: "#F3D27A" }]}>{userStats.streak}</Text>
        </View>
      </View>

      <View style={scStyles.dayLabels}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={[scStyles.dayLabel, { color: colors.mutedForeground }]}>{d}</Text>
        ))}
      </View>

      <View style={scStyles.grid}>
        {byWeek.map((week, wi) => (
          <View key={wi} style={scStyles.col}>
            {week.map((cell) => (
              <View
                key={cell.iso}
                style={[
                  scStyles.cell,
                  cell.isToday && { borderColor: colors.primary, borderWidth: 1.5 },
                  {
                    backgroundColor: cell.done
                      ? colors.success
                      : cell.future
                        ? colors.muted + "40"
                        : colors.success + "40",
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={scStyles.legend}>
        <View style={[scStyles.legendDot, { backgroundColor: colors.success }]} />
        <Text style={[scStyles.legendText, { color: colors.mutedForeground }]}>Completed</Text>
        <View style={[scStyles.legendDot, { backgroundColor: colors.muted, marginLeft: 10 }]} />
        <Text style={[scStyles.legendText, { color: colors.mutedForeground }]}>Missed</Text>
        <View style={[scStyles.legendDotToday, { borderColor: colors.primary, marginLeft: 10 }]} />
        <Text style={[scStyles.legendText, { color: colors.mutedForeground }]}>Today</Text>
      </View>
    </View>
  );
}

const scStyles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 18, marginBottom: 20, flex: 1, minHeight: 320 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  title: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  streakPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  streakText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  dayLabels: { flexDirection: "row", gap: 4, marginBottom: 12, justifyContent: "center" },
  dayLabel: { flex: 1, fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  grid: { flexDirection: "column", gap: 4, flex: 1, justifyContent: "space-evenly" },
  col: { flexDirection: "row", gap: 4, justifyContent: "space-evenly" },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 6, minWidth: 32, minHeight: 32 },
  legend: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 14 },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendDotToday: { width: 12, height: 12, borderRadius: 4, borderWidth: 2, backgroundColor: "transparent" },
  legendText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});

export default function GoalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, userStats, level, userProfile, addGoal, updateGoalProgress, deleteGoal } = useFitness();
  const [showAdd, setShowAdd] = useState(false);
  const [goalStep, setGoalStep] = useState<"form" | "preview">("form");
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalUnit, setNewGoalUnit] = useState("kg");
  const [newGoalDuration, setNewGoalDuration] = useState("");
  const [newGoalPurpose, setNewGoalPurpose] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [longPressedGoal, setLongPressedGoal] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const translateY = React.useRef(new Animated.Value(0)).current;
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) {
          setGoalStep("form");
          setShowAdd(false);
          translateY.setValue(0);
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const closeModal = () => { setGoalStep("form"); setShowAdd(false); translateY.setValue(0); };

  const handleAddGoal = async () => {
    if (!newGoalTitle || !newGoalTarget) return;
    await addGoal({
      title: newGoalTitle,
      targetValue: parseFloat(newGoalTarget),
      currentValue: 0,
      unit: newGoalUnit,
      category: newGoalPurpose || "custom",
      deadline: newGoalDuration ? new Date(Date.now() + parseInt(newGoalDuration) * 24 * 60 * 60 * 1000).toISOString() : null,
      description: newGoalDescription,
      purpose: newGoalPurpose,
    });
    setNewGoalTitle("");
    setNewGoalTarget("");
    setNewGoalDuration("");
    setNewGoalPurpose("");
    setNewGoalDescription("");
    closeModal();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Goals & AI Plan</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={20} color="#0D0D0D" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#8FB8FF15", "#A78BFA15", "transparent"]}
          style={styles.planBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.planBannerTop}>
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <Text style={[styles.planBannerTitle, { color: colors.foreground }]}>AI Fitness Roadmap</Text>
          </View>
          <Text style={[styles.planBannerSub, { color: colors.mutedForeground }]}>
            Personalized for your {userProfile.fitnessGoal.replace("_", " ")} goal · Level {level}
          </Text>
          <View style={styles.planTags}>
            {["4-Week Plan", "Progressive Overload", "AI Adapted"].map((t) => (
              <View key={t} style={[styles.planTag, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "30" }]}>
                <Text style={[styles.planTagText, { color: colors.primary }]}>{t}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {goals.length > 0 && (
          <View style={[styles.goalsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.goalsBoxHeader}>
              <Ionicons name="flag" size={18} color={colors.primary} />
              <Text style={[styles.goalsBoxTitle, { color: colors.foreground }]}>Active Goals</Text>
            </View>
            {goals.slice(0, 2).map((goal) => (
              <View key={goal.id} style={[styles.goalBoxItem, { borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalBoxName, { color: colors.foreground }]}>{goal.title}</Text>
                  {goal.purpose ? <Text style={[styles.goalBoxPurpose, { color: colors.mutedForeground }]}>For: {goal.purpose}</Text> : null}
                  {goal.description ? <Text style={[styles.goalBoxDesc, { color: colors.mutedForeground }]}>{goal.description}</Text> : null}
                </View>
                <Text style={[styles.goalBoxTarget, { color: colors.primary }]}>{goal.currentValue} / {goal.targetValue} {goal.unit}</Text>
              </View>
            ))}
          </View>
        )}

        <StreakCalendar />

        {goals.map((goal) => {
          const progress = Math.min(goal.currentValue / goal.targetValue, 1);
          const progressPct = Math.round(progress * 100);
          const isComplete = goal.completed;
          const isPressed = longPressedGoal === goal.id;
          return (
            <TouchableOpacity
              key={goal.id}
              onLongPress={() => setLongPressedGoal(goal.id)}
              onPress={() => { if (isPressed) setLongPressedGoal(null); }}
              delayLongPress={500}
              style={[styles.goalCard, { backgroundColor: colors.card, borderColor: isPressed ? colors.destructive : (isComplete ? colors.success + "40" : colors.border) }]}
              activeOpacity={0.85}
            >
              <View style={styles.goalTop}>
                <Text style={[styles.goalTitle, { color: colors.foreground }]}>{goal.title}</Text>
                {isComplete && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
              </View>
              <View style={styles.goalProgress}>
                <Text style={[styles.goalValues, { color: colors.mutedForeground }]}>
                  {goal.currentValue} / {goal.targetValue} {goal.unit}
                </Text>
                <Text style={[styles.goalPct, { color: isComplete ? colors.success : colors.primary }]}>{progressPct}%</Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
                <LinearGradient
                  colors={isComplete ? ["#7BE0B8", "#5EC89A"] : [colors.primary, colors.primary + "80"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progressPct}%` }]}
                />
              </View>
              <View style={styles.goalActions}>
                {isPressed ? (
                  <TouchableOpacity
                    onPress={() => { deleteGoal(goal.id); setLongPressedGoal(null); }}
                    style={[styles.deleteBtn, { backgroundColor: colors.destructive }]}
                  >
                    <Ionicons name="trash" size={14} color="#FFF" />
                    <Text style={styles.deleteBtnText}>Remove Goal</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => updateGoalProgress(goal.id, Math.min(goal.currentValue + goal.targetValue * 0.1, goal.targetValue))}
                    style={[styles.progressBtn, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "30" }]}
                  >
                    <Ionicons name="add" size={14} color={colors.primary} />
                    <Text style={[styles.progressBtnText, { color: colors.primary }]}>Update Progress</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>4-Week AI Program</Text>

        {AI_PLAN_WEEKS.map((week) => (
          <View key={week.week} style={[styles.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.weekHeader}>
              <View style={[styles.weekNum, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.weekNumText, { color: colors.primary }]}>W{week.week}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.weekLabel, { color: colors.foreground }]}>{week.label}</Text>
                <Text style={[styles.weekFocus, { color: colors.mutedForeground }]}>{week.focus}</Text>
              </View>
            </View>
            <View style={styles.weekWorkouts}>
              {week.workouts.map((w) => (
                <View key={w} style={[styles.weekWorkoutRow, { borderColor: colors.border }]}>
                  <View style={[styles.workoutDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.weekWorkoutText, { color: colors.foreground }]}>{w}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={[styles.nutritionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient colors={["#FF2D7815", "transparent"]} style={StyleSheet.absoluteFill} />
          <View style={styles.nutritionTop}>
            <Ionicons name="nutrition" size={18} color={colors.accent} />
            <Text style={[styles.nutritionTitle, { color: colors.foreground }]}>AI Nutrition Suggestions</Text>
          </View>
          {["Protein: 2.0g per kg body weight", "Calorie surplus: 200-300 kcal on training days", "Hydration: 3-4L water daily", "Pre-workout: Complex carbs 2h before"].map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip}</Text>
            </View>
          ))}
          <TouchableOpacity style={[styles.progressBtn, { backgroundColor: colors.accent + "20", borderColor: colors.accent + "30", marginTop: 8 }]}>
            <Text style={[styles.progressBtnText, { color: colors.accent }]}>View Full Nutrition Plan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScroll}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[styles.modalCard, { backgroundColor: colors.card, transform: [{ translateY }] }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.dragHandle} />

              {goalStep === "form" ? (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalIconCircle, { backgroundColor: colors.primary + "20" }]}>
                      <Ionicons name="flag" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Goal</Text>
                      <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>Set it up in a few taps</Text>
                    </View>
                    <TouchableOpacity onPress={closeModal} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                      <Ionicons name="close" size={18} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                    <Ionicons name="create-outline" size={16} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.inlineInput, { color: colors.foreground }]}
                      placeholder="Goal title (e.g., Bench Press PR)"
                      placeholderTextColor={colors.mutedForeground}
                      value={newGoalTitle}
                      onChangeText={setNewGoalTitle}
                    />
                  </View>

                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PURPOSE</Text>
                  <View style={styles.chipRow}>
                    {PURPOSE_CHIPS.map((chip) => {
                      const active = newGoalPurpose === chip;
                      return (
                        <TouchableOpacity
                          key={chip}
                          onPress={() => setNewGoalPurpose(active ? "" : chip)}
                          style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.muted }]}
                        >
                          <Text style={[styles.chipText, { color: active ? "#0D0D0D" : colors.foreground }]}>{chip}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TextInput
                    style={[styles.modalInput, { height: 60, backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border, textAlignVertical: "top" }]}
                    placeholder="Add a description (optional)"
                    placeholderTextColor={colors.mutedForeground}
                    value={newGoalDescription}
                    onChangeText={setNewGoalDescription}
                    multiline
                  />

                  <View style={styles.modalRow}>
                    <TextInput
                      style={[styles.modalInput, { flex: 1, backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                      placeholder="Target"
                      placeholderTextColor={colors.mutedForeground}
                      value={newGoalTarget}
                      onChangeText={setNewGoalTarget}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.modalInput, { width: 72, backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                      placeholder="Unit"
                      placeholderTextColor={colors.mutedForeground}
                      value={newGoalUnit}
                      onChangeText={setNewGoalUnit}
                    />
                  </View>

                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DURATION</Text>
                  <View style={styles.chipRow}>
                    {DURATION_CHIPS.map((days) => {
                      const active = newGoalDuration === days;
                      return (
                        <TouchableOpacity
                          key={days}
                          onPress={() => setNewGoalDuration(active ? "" : days)}
                          style={[styles.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.muted }]}
                        >
                          <Text style={[styles.chipText, { color: active ? "#0D0D0D" : colors.foreground }]}>{days}d</Text>
                        </TouchableOpacity>
                      );
                    })}
                    <TextInput
                      style={[styles.chip, styles.chipInput, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
                      placeholder="Custom"
                      placeholderTextColor={colors.mutedForeground}
                      value={DURATION_CHIPS.includes(newGoalDuration) ? "" : newGoalDuration}
                      onChangeText={setNewGoalDuration}
                      keyboardType="numeric"
                    />
                  </View>

                  <TouchableOpacity onPress={() => setGoalStep("preview")} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.modalBtnText}>Preview Goal →</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalIconCircle, { backgroundColor: colors.primary + "20" }]}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalTitle, { color: colors.foreground }]}>Preview Goal</Text>
                      <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>Review before creating</Text>
                    </View>
                    <TouchableOpacity onPress={() => setGoalStep("form")}>
                      <Text style={[styles.editLink, { color: colors.primary }]}>← Edit</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.goalPreviewCard, { backgroundColor: colors.background, borderColor: colors.primary + "30" }]}>
                    <LinearGradient colors={[colors.primary + "10", "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                    <Text style={[styles.goalPreviewTitle, { color: colors.foreground }]}>{newGoalTitle || "New Goal"}</Text>
                    {newGoalPurpose ? (
                      <View style={[styles.previewChip, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
                        <Text style={[styles.previewChipText, { color: colors.primary }]}>{newGoalPurpose}</Text>
                      </View>
                    ) : null}
                    {newGoalDescription ? <Text style={[styles.goalPreviewDesc, { color: colors.mutedForeground }]}>{newGoalDescription}</Text> : null}
                    <View style={styles.previewStats}>
                      <View style={styles.previewStat}>
                        <Ionicons name="trophy-outline" size={14} color={colors.primary} />
                        <Text style={[styles.previewStatText, { color: colors.foreground }]}>{newGoalTarget || "0"} {newGoalUnit}</Text>
                      </View>
                      {newGoalDuration ? (
                        <View style={styles.previewStat}>
                          <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
                          <Text style={[styles.previewStatText, { color: colors.mutedForeground }]}>{newGoalDuration} days</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <TouchableOpacity onPress={handleAddGoal} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.modalBtnText}>Create Goal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={closeModal}>
                    <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </Animated.View>
          </ScrollView>
        </View>
      </Modal>
      <LinearGradient
        colors={[colors.background, colors.background + "00"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: topPad + 80 }}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 26, fontFamily: "Poppins_700Bold", letterSpacing: -0.5 },
  addBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20 },
  planBanner: { borderRadius: 20, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: "#8FB8FF20" },
  planBannerTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  planBannerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  planBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 12 },
  planTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  planTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  planTagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3, marginBottom: 14 },
  goalCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  goalTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  goalTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  goalProgress: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  goalValues: { fontSize: 12, fontFamily: "Inter_400Regular" },
  goalPct: { fontSize: 12, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", borderRadius: 3 },
  goalActions: {},
  progressBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  progressBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  deleteBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  deleteBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  weekCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  weekHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  weekNum: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  weekNumText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  weekLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  weekFocus: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  weekWorkouts: { gap: 8 },
  weekWorkoutRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 8, borderTopWidth: 1 },
  workoutDot: { width: 6, height: 6, borderRadius: 3 },
  weekWorkoutText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  nutritionCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginTop: 8, overflow: "hidden" },
  nutritionTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  nutritionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 3 },
  tipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  goalsBox: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 20 },
  goalsBoxHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  goalsBoxTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  goalBoxItem: { paddingVertical: 12, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  goalBoxName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  goalBoxPurpose: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 2 },
  goalBoxDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  goalBoxTarget: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalScroll: { flexGrow: 1, justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14 },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#FFFFFF20", alignSelf: "center", marginBottom: 4 },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalIconCircle: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalSubtitle: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 2 },
  inlineInput: { flex: 1, paddingVertical: 11, fontSize: 14, fontFamily: "Inter_400Regular" },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginTop: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipInput: { minWidth: 72, fontSize: 12, fontFamily: "Inter_400Regular", paddingHorizontal: 12 },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modalInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  modalRow: { flexDirection: "row", gap: 10 },
  modalBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  modalBtnText: { color: "#0D0D0D", fontSize: 16, fontFamily: "Inter_700Bold" },
  cancelText: { textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  editLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  goalPreviewCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 8, overflow: "hidden" },
  goalPreviewTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  goalPreviewDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  previewChip: { alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  previewChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  previewStats: { flexDirection: "row", gap: 16, marginTop: 4 },
  previewStat: { flexDirection: "row", alignItems: "center", gap: 5 },
  previewStatText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
