import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS, CATEGORY_COLORS } from "@/constants/workouts";
import { WorkoutTimer } from "@/components/WorkoutTimer";

export default function WorkoutDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { todaysWorkouts, completeWorkout } = useFitness();
  const [activeExercise, setActiveExercise] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const workout = SAMPLE_WORKOUTS.find((w) => w.id === id);
  if (!workout) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={[styles.errorText, { color: colors.foreground }]}>Workout not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[workout.category];
  const progress = completedExercises.size / workout.exercises.length;

  const markExerciseDone = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    if (idx < workout.exercises.length - 1) {
      setActiveExercise(idx + 1);
      setShowRestTimer(true);
    }
  };

  const handleComplete = async () => {
    const sw = todaysWorkouts.find((s) => s.workoutId === workout.id);
    if (sw) {
      await completeWorkout(sw.id);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const allDone = completedExercises.size >= workout.exercises.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[catColor + "30", colors.background]}
          style={[styles.headerGrad, { paddingTop: topPad + 12 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: "rgba(0,0,0,0.3)" }]}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={[styles.categoryChip, { backgroundColor: catColor + "30", borderColor: catColor + "50" }]}>
              <Text style={[styles.categoryText, { color: catColor }]}>{workout.category.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.workoutName}>{workout.name}</Text>
          <Text style={[styles.workoutDesc, { color: "rgba(255,255,255,0.65)" }]}>{workout.description}</Text>

          <View style={styles.metaRow}>
            {[
              { icon: "time-outline", val: `${workout.durationMinutes}m` },
              { icon: "flame-outline", val: `${workout.calories} cal` },
              { icon: "flash-outline", val: `+${workout.xpReward} XP` },
              { icon: "barbell-outline", val: `${workout.exercises.length} ex` },
            ].map((m) => (
              <View key={m.icon} style={styles.metaPill}>
                <Ionicons name={m.icon as any} size={13} color="rgba(255,255,255,0.7)" />
                <Text style={styles.metaText}>{m.val}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.progressTop}>
              <Text style={[styles.progressLabel, { color: colors.foreground }]}>Progress</Text>
              <Text style={[styles.progressCount, { color: colors.primary }]}>
                {completedExercises.size}/{workout.exercises.length}
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <LinearGradient
                colors={["#00D4FF", "#0099CC"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
          </View>

          {isActive && (
            <WorkoutTimer
              initialSeconds={workout.durationMinutes * 60}
              label="Workout Duration"
              type="total"
              autoStart
            />
          )}

          {!isActive && (
            <TouchableOpacity
              onPress={() => { setIsActive(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }}
              style={styles.startBtn}
            >
              <LinearGradient colors={["#00D4FF", "#0099CC"]} style={styles.startBtnGrad}>
                <Ionicons name="play" size={20} color="#08081A" />
                <Text style={styles.startBtnText}>Start Workout</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {showRestTimer && (
            <View style={{ marginBottom: 16 }}>
              <WorkoutTimer
                initialSeconds={workout.exercises[activeExercise]?.restSeconds ?? 60}
                label="Rest Timer"
                type="rest"
                autoStart
                onComplete={() => setShowRestTimer(false)}
              />
            </View>
          )}

          <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>Exercises</Text>

          {workout.exercises.map((exercise, idx) => {
            const isDone = completedExercises.has(idx);
            const isActive2 = idx === activeExercise && !isDone;

            return (
              <View key={exercise.id} style={[
                styles.exerciseCard,
                { backgroundColor: colors.card, borderColor: isActive2 ? catColor + "60" : isDone ? colors.success + "30" : colors.border },
                isActive2 && { borderLeftWidth: 3, borderLeftColor: catColor },
              ]}>
                <View style={styles.exerciseTop}>
                  <View style={[styles.exNum, { backgroundColor: isDone ? colors.success : isActive2 ? catColor : colors.muted }]}>
                    {isDone
                      ? <Ionicons name="checkmark" size={14} color="#08081A" />
                      : <Text style={[styles.exNumText, { color: isActive2 ? "#08081A" : colors.mutedForeground }]}>{idx + 1}</Text>
                    }
                  </View>
                  <View style={styles.exInfo}>
                    <Text style={[styles.exName, { color: colors.foreground }]}>{exercise.name}</Text>
                    <Text style={[styles.exMeta, { color: colors.mutedForeground }]}>
                      {exercise.sets} sets × {exercise.reps} {typeof exercise.reps === "number" ? "reps" : ""} · Rest: {exercise.restSeconds}s
                    </Text>
                    <View style={styles.exMuscles}>
                      {exercise.targetMuscles.map((m) => (
                        <View key={m} style={[styles.exMuscleChip, { backgroundColor: colors.muted }]}>
                          <Text style={[styles.exMuscleText, { color: colors.mutedForeground }]}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  {!isDone && (
                    <TouchableOpacity
                      onPress={() => markExerciseDone(idx)}
                      style={[styles.doneBtn, { backgroundColor: catColor + "20", borderColor: catColor + "40" }]}
                    >
                      <Ionicons name="checkmark" size={18} color={catColor} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {allDone && (
            <TouchableOpacity onPress={handleComplete} style={styles.completeBtn}>
              <LinearGradient colors={["#00E5A0", "#00B87A"]} style={styles.completeBtnGrad}>
                <Ionicons name="trophy" size={20} color="#08081A" />
                <Text style={styles.completeBtnText}>Complete Workout — Claim XP</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 16 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  categoryText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  workoutName: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: -0.8, marginBottom: 8 },
  workoutDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 16 },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  metaText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  progressCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16 },
  progressTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  progressCount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  startBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  startBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  startBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#08081A" },
  exerciseTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3, marginBottom: 14 },
  exerciseCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10 },
  exerciseTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  exNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 2 },
  exNumText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  exInfo: { flex: 1 },
  exName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  exMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 6 },
  exMuscles: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  exMuscleChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  exMuscleText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  doneBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  completeBtn: { borderRadius: 18, overflow: "hidden", marginTop: 8 },
  completeBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16 },
  completeBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#08081A" },
});
