import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, PanResponder, Dimensions, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { resolveWorkoutDisplay } from "@/lib/workoutDisplay";
import { getWorkoutAccent } from "@/constants/workoutAccents";
import { Workout, Exercise, WorkoutCategory } from "@/constants/workouts";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;

const QUOTES = [
  "The body achieves what the mind believes.",
  "Every rep is a decision to be better.",
  "Pain is temporary. Glory is permanent.",
  "Discipline is choosing what you want most over what you want now.",
  "You don't find willpower. You build it.",
  "No shortcuts. No excuses. Only results.",
  "Push past the voice that says you can't.",
  "Earn your rest.",
];

type MusicTrack = { title: string; artist: string; bpm: number; genre: string };

const TRACKS_HIGH: MusicTrack[] = [
  { title: "War Ready", artist: "REGIME × AI", bpm: 140, genre: "Electronic" },
  { title: "No Limits", artist: "HardCode", bpm: 145, genre: "Trap" },
  { title: "Rise Up", artist: "APEX", bpm: 138, genre: "EDM" },
];
const TRACKS_MED: MusicTrack[] = [
  { title: "Grind Season", artist: "Iron Circuit", bpm: 120, genre: "Hip-Hop" },
  { title: "Locked In", artist: "MVMT", bpm: 115, genre: "Rock" },
  { title: "Push The Pace", artist: "Velocity", bpm: 118, genre: "Drum & Bass" },
];
const TRACKS_LOW: MusicTrack[] = [
  { title: "Flow State", artist: "Ambient Lab", bpm: 80, genre: "Ambient" },
  { title: "Recovery Mode", artist: "Stillwave", bpm: 75, genre: "Lo-Fi" },
  { title: "Breathe", artist: "Zen Circuit", bpm: 72, genre: "Chill" },
];

function getIntensity(ex: Exercise, category: WorkoutCategory): number {
  let base = 50;
  if (category === "hiit") base = 88;
  else if (category === "cardio" || category === "running") base = 72;
  else if (category === "strength") base = 60;
  else if (category === "recovery") base = 22;
  if (ex.restSeconds < 30) base += 10;
  else if (ex.restSeconds > 90) base -= 8;
  if (ex.sets >= 5) base += 10;
  else if (ex.sets <= 1) base -= 12;
  if (ex.targetMuscles.some((m) => m.toLowerCase().includes("full body"))) base += 5;
  return Math.min(100, Math.max(8, Math.round(base)));
}

function getTrack(intensity: number, workoutId: string): MusicTrack {
  const pool = intensity >= 70 ? TRACKS_HIGH : intensity >= 45 ? TRACKS_MED : TRACKS_LOW;
  const hash = workoutId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return pool[hash % pool.length];
}

function intensityColor(v: number): string {
  if (v >= 75) return "#FF2D78";
  if (v >= 50) return "#F3D27A";
  return "#7BE0B8";
}

interface RestScreenProps {
  nextExercise: Exercise;
  restSeconds: number;
  onDone: () => void;
  colors: ReturnType<typeof useColors>;
}
function RestScreen({ nextExercise, restSeconds, onDone, colors }: RestScreenProps) {
  const [count, setCount] = useState(restSeconds);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const iv = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearInterval(iv); onDone(); return 0; }
        if (c <= 4) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return c - 1;
      });
    }, 1000);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.06, duration: 900, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== "web" }),
      ])
    ).start();
    return () => clearInterval(iv);
  }, []);

  return (
    <View style={rest.wrap}>
      <Text style={[rest.label, { color: colors.mutedForeground }]}>REST</Text>
      <Animated.Text style={[rest.count, { color: colors.foreground, transform: [{ scale: scaleAnim }] }]}>
        {count}
      </Animated.Text>
      <Text style={[rest.next, { color: colors.mutedForeground }]}>Next up</Text>
      <Text style={[rest.nextName, { color: colors.foreground }]}>{nextExercise.name}</Text>
      <Text style={[rest.nextMeta, { color: colors.mutedForeground }]}>
        {nextExercise.sets} sets · {nextExercise.reps} reps
      </Text>
      <TouchableOpacity onPress={onDone} style={[rest.skip, { borderColor: colors.border }]}>
        <Text style={[rest.skipText, { color: colors.mutedForeground }]}>Skip Rest</Text>
      </TouchableOpacity>
    </View>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  total: number;
  intensity: number;
  catColor: string;
  onComplete: () => void;
  onBack: () => void;
  colors: ReturnType<typeof useColors>;
}
function ExerciseCard({ exercise, index, total, intensity, catColor, onComplete, onBack, colors }: ExerciseCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const dirRef = useRef<"left" | "right" | null>(null);

  const rotate = translateX.interpolate({
    inputRange: [-SCREEN_W, 0, SCREEN_W],
    outputRange: ["-12deg", "0deg", "12deg"],
  });
  const doneOpacity = translateX.interpolate({ inputRange: [0, 60, 120], outputRange: [0, 0.6, 1] });
  const backOpacity = translateX.interpolate({ inputRange: [-120, -60, 0], outputRange: [1, 0.6, 0] });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 6,
      onPanResponderMove: (_, gs) => {
        translateX.setValue(gs.dx);
        const d = gs.dx > 40 ? "right" : gs.dx < -40 ? "left" : null;
        if (d !== dirRef.current) {
          dirRef.current = d;
          setDirection(d);
          if (d) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > SWIPE_THRESHOLD) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.parallel([
            Animated.spring(translateX, { toValue: SCREEN_W * 1.5, useNativeDriver: Platform.OS !== "web" }),
            Animated.timing(cardOpacity, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== "web" }),
          ]).start(onComplete);
        } else if (gs.dx < -SWIPE_THRESHOLD && index > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.spring(translateX, { toValue: -SCREEN_W * 1.5, useNativeDriver: Platform.OS !== "web" }).start(onBack);
        } else {
          dirRef.current = null;
          setDirection(null);
          Animated.spring(translateX, { toValue: 0, useNativeDriver: Platform.OS !== "web" }).start();
        }
      },
    })
  ).current;

  const iColor = intensityColor(intensity);

  return (
    <Animated.View
      style={[card.wrap, { opacity: cardOpacity, transform: [{ translateX }, { rotate }] }]}
      {...panResponder.panHandlers}
    >
      <View style={[card.card, { backgroundColor: colors.card, borderColor: catColor + "40" }]}>
        <LinearGradient
          colors={[catColor + "18", catColor + "05", "transparent"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <View style={card.header}>
          <View style={[card.chip, { backgroundColor: catColor + "25", borderColor: catColor + "50" }]}>
            <Text style={[card.chipText, { color: catColor }]}>{index + 1}/{total}</Text>
          </View>
          <View style={[card.intensityBadge, { backgroundColor: iColor + "20" }]}>
            <View style={[card.intensityDot, { backgroundColor: iColor }]} />
            <Text style={[card.intensityLabel, { color: iColor }]}>{intensity}% intensity</Text>
          </View>
        </View>

        <Text style={[card.exerciseName, { color: colors.foreground }]}>{exercise.name}</Text>

        <View style={card.setsRow}>
          <View style={[card.setBlock, { backgroundColor: colors.background + "AA", borderColor: colors.border }]}>
            <Text style={[card.setNum, { color: colors.foreground }]}>{exercise.sets}</Text>
            <Text style={[card.setLabel, { color: colors.mutedForeground }]}>SETS</Text>
          </View>
          <View style={[card.setDivider, { backgroundColor: colors.border }]} />
          <View style={[card.setBlock, { backgroundColor: colors.background + "AA", borderColor: colors.border }]}>
            <Text style={[card.setNum, { color: colors.foreground }]}>{exercise.reps}</Text>
            <Text style={[card.setLabel, { color: colors.mutedForeground }]}>REPS</Text>
          </View>
          {exercise.restSeconds > 0 && (
            <>
              <View style={[card.setDivider, { backgroundColor: colors.border }]} />
              <View style={[card.setBlock, { backgroundColor: colors.background + "AA", borderColor: colors.border }]}>
                <Text style={[card.setNum, { color: colors.foreground }]}>{exercise.restSeconds}s</Text>
                <Text style={[card.setLabel, { color: colors.mutedForeground }]}>REST</Text>
              </View>
            </>
          )}
        </View>

        <View style={card.musclesWrap}>
          {exercise.targetMuscles.slice(0, 3).map((m) => (
            <View key={m} style={[card.muscleTag, { backgroundColor: catColor + "15", borderColor: catColor + "30" }]}>
              <Text style={[card.muscleText, { color: catColor }]}>{m}</Text>
            </View>
          ))}
        </View>

        <View style={card.swipeGuide}>
          <Ionicons name="arrow-back" size={14} color={colors.mutedForeground} />
          <Text style={[card.swipeText, { color: colors.mutedForeground }]}>Back</Text>
          <View style={card.swipeDivide} />
          <Text style={[card.swipeText, { color: colors.mutedForeground }]}>Done</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.mutedForeground} />
        </View>
      </View>

      <Animated.View style={[card.doneOverlay, { opacity: doneOpacity }]}>
        <Ionicons name="checkmark-circle" size={48} color="#7BE0B8" />
        <Text style={card.doneText}>DONE</Text>
      </Animated.View>
      <Animated.View style={[card.backOverlay, { opacity: backOpacity }]}>
        <Ionicons name="arrow-back-circle" size={48} color="#A1A1A1" />
        <Text style={card.backText}>BACK</Text>
      </Animated.View>
    </Animated.View>
  );
}

interface MusicPlayerProps {
  track: MusicTrack;
  intensity: number;
  colors: ReturnType<typeof useColors>;
}
function MusicPlayer({ track, intensity, colors }: MusicPlayerProps) {
  const [playing, setPlaying] = useState(true);
  const progressAnim = useRef(new Animated.Value(0.28)).current;
  const iColor = intensityColor(intensity);

  useEffect(() => {
    progressAnim.setValue(0.28);
    Animated.timing(progressAnim, {
      toValue: 0.28 + Math.random() * 0.3,
      duration: 6000,
      useNativeDriver: false,
    }).start();
  }, [track.title]);

  const barW = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={[music.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[music.albumIcon, { backgroundColor: iColor + "20" }]}>
        <Ionicons name="musical-note" size={18} color={iColor} />
      </View>
      <View style={music.trackInfo}>
        <Text style={[music.trackTitle, { color: colors.foreground }]} numberOfLines={1}>{track.title}</Text>
        <Text style={[music.trackArtist, { color: colors.mutedForeground }]} numberOfLines={1}>
          {track.artist} · {track.genre} · {track.bpm} BPM
        </Text>
        <View style={[music.progressBar, { backgroundColor: colors.border }]}>
          <Animated.View style={[music.progressFill, { width: barW, backgroundColor: iColor }]} />
        </View>
      </View>
      <View style={music.controls}>
        <TouchableOpacity onPress={() => {}} style={music.ctrlBtn}>
          <Ionicons name="play-skip-back" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setPlaying((p) => !p)}
          style={[music.playBtn, { backgroundColor: iColor }]}
        >
          <Ionicons name={playing ? "pause" : "play"} size={16} color="#0D0D0D" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}} style={music.ctrlBtn}>
          <Ionicons name="play-skip-forward" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface IntensityBarProps {
  intensity: number;
  colors: ReturnType<typeof useColors>;
}
function IntensityBar({ intensity, colors }: IntensityBarProps) {
  const heightAnim = useRef(new Animated.Value(intensity)).current;
  const iColor = intensityColor(intensity);

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: intensity,
      friction: 4,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [intensity]);

  const barH = heightAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const barColor = heightAnim.interpolate({
    inputRange: [0, 50, 100],
    outputRange: ["#7BE0B8", "#F3D27A", "#FF2D78"],
  });

  return (
    <View style={[ibar.container, { borderColor: colors.border }]}>
      <Text style={[ibar.topLabel, { color: colors.mutedForeground }]}>
        {Math.round(intensity)}
      </Text>
      <View style={[ibar.track, { backgroundColor: colors.background }]}>
        <Animated.View style={[ibar.fill, { height: barH, backgroundColor: barColor }]} />
      </View>
      <Text style={[ibar.bottomLabel, { color: colors.mutedForeground }]}>%</Text>
    </View>
  );
}

export interface WorkoutPlayerModalProps {
  visible: boolean;
  workout: Workout;
  scheduledId: string | null;
  onClose: () => void;
  onComplete: (scheduledId: string) => void;
}

export function WorkoutPlayerModal({
  visible, workout, scheduledId, onClose, onComplete,
}: WorkoutPlayerModalProps) {
  const colors = useColors();
  const { workoutLibraryCustomization } = useFitness();
  const insets = useSafeAreaInsets();
  const { accentCategory, displayName } = resolveWorkoutDisplay(workout, workoutLibraryCustomization);
  const catColor = getWorkoutAccent(colors, accentCategory).main;

  const [exIdx, setExIdx] = useState(0);
  const [resting, setResting] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [cardKey, setCardKey] = useState(0);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const doneScale = useRef(new Animated.Value(0.8)).current;
  const doneOpacity = useRef(new Animated.Value(0)).current;

  const exercises = workout.exercises;
  const currentEx = exercises[exIdx];
  const intensity = currentEx ? getIntensity(currentEx, workout.category) : 50;
  const track = getTrack(intensity, workout.id);
  const progress = completed.size / exercises.length;

  useEffect(() => {
    if (!visible) {
      setExIdx(0); setResting(false);
      setCompleted(new Set()); setDone(false); setCardKey(0);
    } else {
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== "web" }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (done) {
      Animated.parallel([
        Animated.spring(doneScale, { toValue: 1, friction: 5, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(doneOpacity, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== "web" }),
      ]).start();
    }
  }, [done]);

  const handleExerciseDone = useCallback(() => {
    const next = new Set(completed);
    next.add(exIdx);
    setCompleted(next);

    if (exIdx < exercises.length - 1) {
      if (currentEx.restSeconds > 0) {
        setResting(true);
      } else {
        setExIdx((i) => i + 1);
        setCardKey((k) => k + 1);
      }
    } else {
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [exIdx, exercises, completed, currentEx]);

  const handleBack = useCallback(() => {
    if (exIdx > 0) {
      setExIdx((i) => i - 1);
      setCardKey((k) => k + 1);
    }
  }, [exIdx]);

  const handleRestDone = useCallback(() => {
    setResting(false);
    setExIdx((i) => i + 1);
    setCardKey((k) => k + 1);
  }, []);

  const handleFinish = () => {
    if (scheduledId) onComplete(scheduledId);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: "#0A0A0A" }]}>
        <LinearGradient
          colors={[catColor + "22", "#0A0A0A", "#0A0A0A"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.35 }}
        />

        {/* Top bar */}
        <Animated.View style={[styles.topBar, { paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 8, opacity: headerOpacity }]}>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: "#1A1A1A", borderColor: "#2E2E2E" }]}>
            <Ionicons name="close" size={18} color="#A1A1A1" />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <Text style={styles.workoutTitle} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.workoutSub}>
              {completed.size}/{exercises.length} exercises · {workout.durationMinutes}min
            </Text>
          </View>
          <View style={[styles.xpChip, { backgroundColor: catColor + "20", borderColor: catColor + "40" }]}>
            <Ionicons name="star" size={11} color={catColor} />
            <Text style={[styles.xpText, { color: catColor }]}>+{workout.xpReward} XP</Text>
          </View>
        </Animated.View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: "#1A1A1A" }]}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: catColor }]} />
        </View>

        {/* Quote */}
        <Text style={styles.quote}>"{QUOTES[(quoteIdx + exIdx) % QUOTES.length]}"</Text>

        {/* Main area */}
        <View style={styles.mainRow}>
          <IntensityBar intensity={intensity} colors={colors} />

          <View style={styles.cardArea}>
            {done ? (
              <Animated.View style={[styles.doneCard, { opacity: doneOpacity, transform: [{ scale: doneScale }], backgroundColor: colors.card, borderColor: catColor + "50" }]}>
                <LinearGradient colors={[catColor + "20", "transparent"]} style={StyleSheet.absoluteFill} />
                <Ionicons name="trophy" size={52} color={catColor} />
                <Text style={[styles.doneTitle, { color: colors.foreground }]}>Session Complete</Text>
                <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
                  {exercises.length} exercises · +{workout.xpReward} XP earned
                </Text>
                <TouchableOpacity
                  onPress={handleFinish}
                  style={[styles.finishBtn, { backgroundColor: catColor }]}
                >
                  <Text style={styles.finishText}>Finish & Claim XP</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : resting && exercises[exIdx + 1] ? (
              <RestScreen
                nextExercise={exercises[exIdx + 1]}
                restSeconds={currentEx.restSeconds}
                onDone={handleRestDone}
                colors={colors}
              />
            ) : currentEx ? (
              <ExerciseCard
                key={cardKey}
                exercise={currentEx}
                index={exIdx}
                total={exercises.length}
                intensity={intensity}
                catColor={catColor}
                onComplete={handleExerciseDone}
                onBack={handleBack}
                colors={colors}
              />
            ) : null}
          </View>

          {/* Right: exercise list mini-indicators */}
          <View style={styles.rightCol}>
            {exercises.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.exDot,
                  {
                    backgroundColor: completed.has(i)
                      ? "#7BE0B8"
                      : i === exIdx
                      ? catColor
                      : "#2E2E2E",
                    height: i === exIdx ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Music player */}
        {!done && (
          <View style={[styles.musicWrap, { paddingBottom: (Platform.OS === "web" ? 24 : insets.bottom) + 8 }]}>
            <MusicPlayer track={track} intensity={intensity} colors={colors} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  titleBlock: { flex: 1 },
  workoutTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#F5F5F5",
    letterSpacing: -0.3,
  },
  workoutSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#A1A1A1", marginTop: 1 },
  xpChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1,
  },
  xpText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 2, marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 2, borderRadius: 2 },
  quote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#555",
    textAlign: "center",
    paddingHorizontal: 32,
    marginTop: 18,
    marginBottom: 10,
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
  mainRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
  },
  cardArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  rightCol: { width: 14, alignItems: "center", gap: 6 },
  exDot: { width: 4, borderRadius: 2 },
  doneCard: {
    width: "100%",
    borderRadius: 28,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  doneTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", letterSpacing: -0.5, marginTop: 4 },
  doneSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  finishBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 100,
  },
  finishText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
  musicWrap: { paddingHorizontal: 16, paddingTop: 10 },
});

const card = StyleSheet.create({
  wrap: { width: "100%", alignItems: "center" },
  card: {
    width: "100%",
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    overflow: "hidden",
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1,
  },
  chipText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  intensityBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  intensityDot: { width: 6, height: 6, borderRadius: 3 },
  intensityLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  exerciseName: {
    fontSize: 30,
    fontFamily: "Poppins_700Bold",
    letterSpacing: -1,
    lineHeight: 34,
  },
  setsRow: { flexDirection: "row", alignItems: "center", gap: 0 },
  setBlock: {
    flex: 1, alignItems: "center", paddingVertical: 14,
    borderRadius: 16, borderWidth: 1, gap: 4,
  },
  setDivider: { width: 1, height: 40, marginHorizontal: 8 },
  setNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  setLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  musclesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  muscleTag: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  muscleText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  swipeGuide: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  swipeText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  swipeDivide: { flex: 1 },
  doneOverlay: {
    position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
    alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 28,
  },
  doneText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#7BE0B8" },
  backOverlay: {
    position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
    alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 28,
  },
  backText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#A1A1A1" },
});

const ibar = StyleSheet.create({
  container: {
    width: 28, height: "85%",
    borderRadius: 14, borderWidth: 1,
    padding: 4,
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  topLabel: { fontSize: 9, fontFamily: "Inter_700Bold", zIndex: 1 },
  track: { flex: 1, width: "100%", borderRadius: 10, overflow: "hidden", justifyContent: "flex-end" },
  fill: { width: "100%", borderRadius: 10 },
  bottomLabel: { fontSize: 9, fontFamily: "Inter_700Bold" },
});

const rest = StyleSheet.create({
  wrap: { alignItems: "center", gap: 8 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  count: { fontSize: 88, fontFamily: "Poppins_700Bold", letterSpacing: -4, lineHeight: 96 },
  next: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8 },
  nextName: { fontSize: 24, fontFamily: "Poppins_600SemiBold", letterSpacing: -0.5 },
  nextMeta: { fontSize: 13, fontFamily: "Inter_400Regular" },
  skip: {
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 100, borderWidth: 1,
  },
  skipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});

const music = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 18, borderWidth: 1,
    padding: 14, gap: 12,
  },
  albumIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  trackInfo: { flex: 1, gap: 3 },
  trackTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  trackArtist: { fontSize: 11, fontFamily: "Inter_400Regular" },
  progressBar: { height: 2, borderRadius: 2, marginTop: 6, overflow: "hidden" },
  progressFill: { height: 2, borderRadius: 2 },
  controls: { flexDirection: "row", alignItems: "center", gap: 8 },
  ctrlBtn: { padding: 4 },
  playBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
});
