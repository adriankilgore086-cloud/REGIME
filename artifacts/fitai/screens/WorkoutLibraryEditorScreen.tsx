import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS, type Workout, type WorkoutCategory } from "@/constants/workouts";
import { getWorkoutAccent, WORKOUT_CATEGORY_ORDER } from "@/constants/workoutAccents";
import { resolveWorkoutDisplay } from "@/lib/workoutDisplay";
import { AppFlashList } from "@/components/AppFlashList";

export default function WorkoutLibraryEditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { workoutLibraryCustomization, updateWorkoutLibraryCustomization } = useFitness();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    SAMPLE_WORKOUTS.forEach((w) => {
      next[w.id] = resolveWorkoutDisplay(w, workoutLibraryCustomization).displayName;
    });
    setDraftNames(next);
  }, [workoutLibraryCustomization]);

  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const scheduleNameSave = useCallback(
    (workoutId: string, text: string) => {
      if (saveTimers.current[workoutId]) clearTimeout(saveTimers.current[workoutId]);
      saveTimers.current[workoutId] = setTimeout(() => {
        const trimmed = text.trim();
        void updateWorkoutLibraryCustomization(workoutId, {
          customName: trimmed.length ? trimmed : undefined,
        });
      }, 420);
    },
    [updateWorkoutLibraryCustomization]
  );

  const onAccentPress = useCallback(
    (workoutId: string, cat: WorkoutCategory, current: WorkoutCategory | undefined) => {
      void Haptics.selectionAsync();
      const next = current === cat ? undefined : cat;
      void updateWorkoutLibraryCustomization(workoutId, { accentCategory: next });
    },
    [updateWorkoutLibraryCustomization]
  );

  const renderItem = useCallback(
    ({ item }: { item: Workout }) => {
      const { displayName, accentCategory } = resolveWorkoutDisplay(item, workoutLibraryCustomization);
      const accent = getWorkoutAccent(colors, accentCategory);
      const nameVal = draftNames[item.id] ?? displayName;

      return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient
            colors={accent.gradient}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={[styles.previewStripe, { backgroundColor: accent.main }]} />

          <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>Live preview</Text>
          <Text style={[styles.previewTitle, { color: colors.foreground }]} numberOfLines={1}>
            {nameVal}
          </Text>
          <Text style={[styles.previewMeta, { color: accent.main }]}>
            {accentCategory.toUpperCase()} · {item.difficulty}
          </Text>

          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Routine name</Text>
          <TextInput
            value={nameVal}
            onChangeText={(t) => {
              setDraftNames((prev) => ({ ...prev, [item.id]: t }));
              scheduleNameSave(item.id, t);
            }}
            placeholder={item.name}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 12 }]}>Widget color</Text>
          <View style={styles.chipRow}>
            {WORKOUT_CATEGORY_ORDER.map((cat) => {
              const ac = getWorkoutAccent(colors, cat);
              const active = accentCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => onAccentPress(item.id, cat, accentCategory)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? ac.main : colors.border,
                      backgroundColor: active ? ac.chipBg : colors.muted,
                    },
                  ]}
                >
                  <View style={[styles.chipDot, { backgroundColor: ac.main }]} />
                  <Text style={[styles.chipText, { color: colors.foreground }]} numberOfLines={1}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    },
    [colors, draftNames, onAccentPress, scheduleNameSave, workoutLibraryCustomization]
  );

  const data = useMemo(() => SAMPLE_WORKOUTS, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
      <LinearGradient
        colors={[colors.primary + "10", "transparent"]}
        style={styles.topGlow}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Library Editor</Text>
        <View style={{ width: 44 }} />
      </View>

      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Rename routines and shift widget colors — updates preview instantly and saves automatically.
      </Text>

      <AppFlashList
        data={data}
        keyExtractor={(w) => w.id}
        estimatedItemSize={320}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: 20, fontFamily: "Poppins_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, paddingHorizontal: 20, marginBottom: 16 },
  listContent: { paddingHorizontal: 20, gap: 16 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    overflow: "hidden",
    marginBottom: 4,
  },
  previewStripe: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  previewLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6, marginBottom: 4 },
  previewTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", marginBottom: 4 },
  previewMeta: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "capitalize", maxWidth: 72 },
});
