import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS, CATEGORY_COLORS } from "@/constants/workouts";
import type { Workout, Exercise } from "@/constants/workouts";

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { scheduleWorkout } = useFitness();
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickedDate, setPickedDate] = useState(new Date().toISOString().split("T")[0]);
  const [longPressedWorkout, setLongPressedWorkout] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIntensity, setEditIntensity] = useState("");
  
  const [customDuration, setCustomDuration] = useState("");
  const [exerciseOverrides, setExerciseOverrides] = useState<Record<string, { sets?: number; reps?: string }>>({});

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleCustomizeWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setCustomDuration(workout.durationMinutes.toString());
    setExerciseOverrides({});
    setShowCustomizeModal(true);
  };

  const handleAddToSchedule = () => {
    if (selectedWorkout) {
      setShowCustomizeModal(false);
      setShowDatePicker(true);
    }
  };

  const handleDateSelected = async (date: string) => {
    if (selectedWorkout) {
      await scheduleWorkout(selectedWorkout.id, date);
      setShowDatePicker(false);
      setSelectedWorkout(null);
    }
  };

  const updateExerciseOverride = (exerciseId: string, field: string, value: any) => {
    setExerciseOverrides((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], [field]: value },
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Workout Library</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} scrollEventThrottle={16} removeClippedSubviews={Platform.OS !== "web"}>
        <View style={styles.content}>
          {SAMPLE_WORKOUTS.map((workout) => {
            const isPressed = longPressedWorkout === workout.id;
            return (
            <View key={workout.id}>
              <TouchableOpacity
                onPress={() => { if (!isPressed) setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id); }}
                onLongPress={() => { setLongPressedWorkout(workout.id); setEditName(workout.name); setEditIntensity(workout.difficulty); }}
                delayLongPress={500}
                style={[styles.workoutCard, { backgroundColor: colors.card, borderColor: isPressed ? colors.primary : colors.border }]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: CATEGORY_COLORS[workout.category] },
                      ]}
                    />
                    <View style={styles.cardInfo}>
                      <Text style={[styles.workoutName, { color: colors.foreground }]}>
                        {workout.name}
                      </Text>
                      <Text style={[styles.workoutMeta, { color: colors.mutedForeground }]}>
                        {workout.durationMinutes}m • {workout.difficulty} • +{workout.xpReward} XP
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name={expandedWorkout === workout.id ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.mutedForeground}
                  />
                </View>
              </TouchableOpacity>

              {expandedWorkout === workout.id && (
                <View style={[styles.expandedContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.descriptionText, { color: colors.mutedForeground }]}>
                    {workout.description}
                  </Text>

                  <View style={styles.exerciseList}>
                    <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Exercises</Text>
                    {workout.exercises.map((exercise) => (
                      <View key={exercise.id} style={[styles.exerciseRow, { borderColor: colors.border }]}>
                        <View style={styles.exerciseInfo}>
                          <Text style={[styles.exerciseName, { color: colors.foreground }]}>
                            {exercise.name}
                          </Text>
                          <Text style={[styles.exerciseMeta, { color: colors.mutedForeground }]}>
                            {exercise.sets} x {exercise.reps} • {exercise.restSeconds}s rest
                          </Text>
                          {exercise.targetMuscles && (
                            <View style={styles.muscleChips}>
                              {exercise.targetMuscles.map((muscle) => (
                                <View
                                  key={muscle}
                                  style={[styles.chip, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}
                                >
                                  <Text style={[styles.chipText, { color: colors.primary }]}>{muscle}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.muscleTargets}>
                    <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Target Muscles</Text>
                    <View style={styles.muscleChips}>
                      {workout.targetMuscles.map((muscle) => (
                        <View
                          key={muscle}
                          style={[styles.targetChip, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}
                        >
                          <Text style={[styles.chipText, { color: colors.primary }]}>{muscle}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleCustomizeWorkout(workout)}
                    style={[styles.customizeBtn, { backgroundColor: colors.primary }]}
                  >
                    <Ionicons name="pencil" size={16} color="#0D0D0D" />
                    <Text style={[styles.customizeBtnText, { color: "#0D0D0D" }]}>Customize & Add to Schedule</Text>
                  </TouchableOpacity>
                </View>
              )}
              {isPressed && (
                <View style={[styles.editPanel, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
                  <View style={styles.editField}>
                    <Text style={[styles.editLabel, { color: colors.foreground }]}>Name</Text>
                    <TextInput
                      style={[styles.editInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                      value={editName}
                      onChangeText={setEditName}
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.editField}>
                    <Text style={[styles.editLabel, { color: colors.foreground }]}>Intensity</Text>
                    <View style={styles.intensityButtons}>
                      {["Easy", "Medium", "Hard"].map((level) => (
                        <TouchableOpacity
                          key={level}
                          onPress={() => setEditIntensity(level)}
                          style={[styles.intensityBtn, { backgroundColor: editIntensity === level ? colors.primary : colors.muted }]}
                        >
                          <Text style={[styles.intensityText, { color: editIntensity === level ? "#0D0D0D" : colors.mutedForeground }]}>{level}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setLongPressedWorkout(null)} style={[styles.saveBtnEdit, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: "#0D0D0D", fontFamily: "Inter_600SemiBold" }}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
          })}
        </View>
      </ScrollView>

      {/* Customize Modal */}
      <Modal visible={showCustomizeModal} transparent animationType="slide" onRequestClose={() => setShowCustomizeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Customize {selectedWorkout?.name}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {/* Duration */}
              <View style={[styles.customField, { borderColor: colors.border }]}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Duration (minutes)</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>

              {/* Exercise Customization */}
              {selectedWorkout?.exercises.map((exercise) => (
                <View key={exercise.id} style={[styles.customField, { borderColor: colors.border }]}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{exercise.name}</Text>
                  
                  <View style={styles.exerciseCustomRow}>
                    <View style={styles.customInput}>
                      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Sets</Text>
                      <TextInput
                        style={[styles.smallInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={exerciseOverrides[exercise.id]?.sets?.toString() || exercise.sets.toString()}
                        onChangeText={(val) => updateExerciseOverride(exercise.id, "sets", parseInt(val) || exercise.sets)}
                        keyboardType="number-pad"
                      />
                    </View>
                    <View style={styles.customInput}>
                      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Reps</Text>
                      <TextInput
                        style={[styles.smallInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={exerciseOverrides[exercise.id]?.reps?.toString() || exercise.reps.toString()}
                        onChangeText={(val) => updateExerciseOverride(exercise.id, "reps", val)}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowCustomizeModal(false)}
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddToSchedule}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.modalBtnText, { color: "#0D0D0D" }]}>Next: Pick Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Date</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {Array.from({ length: 30 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() + i);
                const iso = d.toISOString().split("T")[0];
                const dateLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                const isToday = iso === new Date().toISOString().split("T")[0];
                return (
                  <TouchableOpacity
                    key={iso}
                    onPress={() => handleDateSelected(iso)}
                    style={[styles.dateRow, { backgroundColor: isToday ? colors.primary + "20" : "transparent", borderColor: colors.border }]}
                  >
                    <Text style={[styles.dateText, { color: colors.foreground, fontWeight: isToday ? "600" : "400" }]}>
                      {dateLabel}
                    </Text>
                    {isToday && <Text style={[styles.todayLabel, { color: colors.primary }]}>Today</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
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
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 },
  workoutCard: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  cardInfo: { flex: 1 },
  workoutName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  workoutMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  expandedContent: { borderTopWidth: 1, padding: 16, gap: 14 },
  descriptionText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  exerciseList: { gap: 8 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  exerciseRow: { borderBottomWidth: 1, paddingBottom: 12, marginBottom: 8, gap: 4 },
  exerciseInfo: { gap: 4 },
  exerciseName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  exerciseMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  muscleChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  muscleTargets: { gap: 8 },
  targetChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  customizeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, marginTop: 6 },
  customizeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 8 },
  customField: { borderBottomWidth: 1, paddingBottom: 14, marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  smallInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, fontFamily: "Inter_400Regular" },
  inputLabel: { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 4 },
  exerciseCustomRow: { flexDirection: "row", gap: 12 },
  customInput: { flex: 1 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dateRow: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, marginBottom: 6 },
  dateText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  todayLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cancelText: { textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular", paddingTop: 8 },
  editPanel: { borderTopWidth: 1, padding: 14, gap: 12 },
  editField: { gap: 6 },
  editLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  editInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, fontFamily: "Inter_400Regular" },
  intensityButtons: { flexDirection: "row", gap: 8 },
  intensityBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  intensityText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  saveBtnEdit: { paddingVertical: 10, borderRadius: 8, alignItems: "center", marginTop: 4 },
});
