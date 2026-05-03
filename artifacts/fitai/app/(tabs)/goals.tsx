import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Modal, TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS } from "@/constants/workouts";

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

export default function GoalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { goals, userStats, level, userProfile, addGoal, updateGoalProgress } = useFitness();
  const [showAdd, setShowAdd] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalUnit, setNewGoalUnit] = useState("kg");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleAddGoal = async () => {
    if (!newGoalTitle || !newGoalTarget) return;
    await addGoal({
      title: newGoalTitle,
      targetValue: parseFloat(newGoalTarget),
      currentValue: 0,
      unit: newGoalUnit,
      category: "custom",
      deadline: null,
    });
    setNewGoalTitle("");
    setNewGoalTarget("");
    setShowAdd(false);
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

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Goals</Text>

        {goals.map((goal) => {
          const progress = Math.min(goal.currentValue / goal.targetValue, 1);
          const progressPct = Math.round(progress * 100);
          const isComplete = goal.completed;
          return (
            <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card, borderColor: isComplete ? colors.success + "40" : colors.border }]}>
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
                  colors={isComplete ? ["#7BE0B8", "#5EC89A"] : ["#FFFFFF", "#D8D8D8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progressPct}%` }]}
                />
              </View>
              <View style={styles.goalActions}>
                <TouchableOpacity
                  onPress={() => updateGoalProgress(goal.id, Math.min(goal.currentValue + goal.targetValue * 0.1, goal.targetValue))}
                  style={[styles.progressBtn, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "30" }]}
                >
                  <Ionicons name="add" size={14} color={colors.primary} />
                  <Text style={[styles.progressBtnText, { color: colors.primary }]}>Update Progress</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>4-Week AI Program</Text>

        {AI_PLAN_WEEKS.map((week) => (
          <View key={week.week} style={[styles.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.weekHeader}>
              <View style={[styles.weekNum, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.weekNumText, { color: colors.primary }]}>W{week.week}</Text>
              </View>
              <View>
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
        </View>
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Goal</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Goal title"
              placeholderTextColor={colors.mutedForeground}
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
            />
            <View style={styles.modalRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                placeholder="Target value"
                placeholderTextColor={colors.mutedForeground}
                value={newGoalTarget}
                onChangeText={setNewGoalTarget}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.modalInput, { width: 70, backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                placeholder="Unit"
                placeholderTextColor={colors.mutedForeground}
                value={newGoalUnit}
                onChangeText={setNewGoalUnit}
              />
            </View>
            <TouchableOpacity onPress={handleAddGoal} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.modalBtnText}>Add Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 14 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  modalRow: { flexDirection: "row", gap: 10 },
  modalBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  modalBtnText: { color: "#0D0D0D", fontSize: 16, fontFamily: "Inter_700Bold" },
  cancelText: { textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular" },
});
