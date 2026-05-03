import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, RefreshControl, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS, CATEGORY_COLORS, Exercise } from "@/constants/workouts";
import { WorkoutSwipeCard } from "@/components/WorkoutSwipeCard";
import { XPProgressBar } from "@/components/XPProgressBar";
import { StatCard } from "@/components/StatCard";
import { RewardOverlay } from "@/components/RewardOverlay";
import { AIChatModal } from "@/components/AIChatModal";

const AI_SUGGESTIONS = [
  "You haven't trained legs in 2 days. Add a leg session today.",
  "Your streak is at 7 days. Keep it alive with today's workout!",
  "Try incline dumbbell press to target your upper chest.",
  "Consider adding a recovery day — you've trained 4 days straight.",
];

const GHOST_STATS = {
  sessions: 3,
  calories: 1240,
  minutes: 125,
  xp: 420,
};

const SMART_RECS = [
  { id: "rec1", name: "HIIT Inferno", tag: "High Calorie Burn", minutes: 30, xp: 200, color: "#FF2D78", icon: "flame" as const },
  { id: "rec2", name: "Mobility Flow", tag: "Recovery Focused", minutes: 20, xp: 80, color: "#7BE0B8", icon: "body" as const },
  { id: "rec3", name: "Core Crusher", tag: "AI Recommended", minutes: 25, xp: 120, color: "#A78BFA", icon: "sparkles" as const },
];

function getDailyCuratedWorkout() {
  const dayIndex = new Date().getDay();
  return SAMPLE_WORKOUTS[dayIndex % SAMPLE_WORKOUTS.length];
}

function DailyCuratedWorkoutCard() {
  const colors = useColors();
  const workout = getDailyCuratedWorkout();
  const accentColor = CATEGORY_COLORS[workout.category] ?? colors.primary;
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const progressAnim = useRef(new Animated.Value(0)).current;

  const exerciseList = workout.exercises.slice(0, 5);
  const doneCount = exerciseList.filter((e) => completed[e.id]).length;
  const pct = exerciseList.length > 0 ? doneCount / exerciseList.length : 0;
  const showBar = started && doneCount > 0;

  useEffect(() => {
    if (showBar) {
      Animated.timing(progressAnim, {
        toValue: pct,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [pct, showBar]);

  const toggleExercise = (id: string) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[dcStyles.card, { backgroundColor: colors.card, borderColor: accentColor + "35" }]}>
      <LinearGradient
        colors={[accentColor + "14", accentColor + "04", "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={dcStyles.topRow}>
        <View style={[dcStyles.badge, { backgroundColor: accentColor + "20", borderColor: accentColor + "40" }]}>
          <Ionicons name="sparkles" size={10} color={accentColor} />
          <Text style={[dcStyles.badgeText, { color: accentColor }]}>AI CURATED FOR TODAY</Text>
        </View>
        <View style={[dcStyles.xpPill, { backgroundColor: colors.primary + "18" }]}>
          <Text style={[dcStyles.xpText, { color: colors.primary }]}>+{workout.xpReward} XP</Text>
        </View>
      </View>

      <Text style={[dcStyles.workoutName, { color: colors.foreground }]}>{workout.name}</Text>

      <View style={dcStyles.metaRow}>
        <View style={dcStyles.metaItem}>
          <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
          <Text style={[dcStyles.metaText, { color: colors.mutedForeground }]}>{workout.durationMinutes} min</Text>
        </View>
        <View style={[dcStyles.dot, { backgroundColor: colors.mutedForeground }]} />
        <View style={dcStyles.metaItem}>
          <Ionicons name="flame-outline" size={13} color={colors.mutedForeground} />
          <Text style={[dcStyles.metaText, { color: colors.mutedForeground }]}>{workout.calories} kcal</Text>
        </View>
        <View style={[dcStyles.dot, { backgroundColor: colors.mutedForeground }]} />
        <Text style={[dcStyles.metaText, { color: accentColor }]}>
          {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
        </Text>
      </View>

      {showBar && (
        <View style={dcStyles.progressWrap}>
          <View style={[dcStyles.progressTrack, { backgroundColor: accentColor + "20" }]}>
            <Animated.View style={[dcStyles.progressFill, { width: barWidth, backgroundColor: accentColor }]} />
          </View>
          <Text style={[dcStyles.progressLabel, { color: accentColor }]}>
            {doneCount}/{exerciseList.length} exercises
          </Text>
        </View>
      )}

      {started && (
        <View style={dcStyles.exerciseList}>
          {exerciseList.map((ex: Exercise) => {
            const done = !!completed[ex.id];
            return (
              <TouchableOpacity
                key={ex.id}
                onPress={() => toggleExercise(ex.id)}
                style={[
                  dcStyles.exerciseRow,
                  { borderColor: done ? accentColor + "40" : colors.border },
                  done && { backgroundColor: accentColor + "0C" },
                ]}
                activeOpacity={0.75}
              >
                <View style={[
                  dcStyles.checkbox,
                  { borderColor: done ? accentColor : colors.border, backgroundColor: done ? accentColor : "transparent" },
                ]}>
                  {done && <Ionicons name="checkmark" size={11} color="#0D0D0D" />}
                </View>
                <View style={dcStyles.exInfo}>
                  <Text style={[dcStyles.exName, { color: done ? colors.mutedForeground : colors.foreground }]}>{ex.name}</Text>
                  <Text style={[dcStyles.exSub, { color: colors.mutedForeground }]}>
                    {ex.sets} × {ex.reps}{typeof ex.reps === "number" ? " reps" : ""}
                  </Text>
                </View>
                {done && <Ionicons name="checkmark-circle" size={16} color={accentColor} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!started ? (
        <TouchableOpacity
          style={[dcStyles.startBtn, { backgroundColor: accentColor }]}
          onPress={() => setStarted(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={14} color="#0D0D0D" />
          <Text style={dcStyles.startBtnText}>Start Today's Workout</Text>
        </TouchableOpacity>
      ) : doneCount === exerciseList.length ? (
        <View style={[dcStyles.doneRow, { backgroundColor: "#7BE0B812", borderColor: "#7BE0B830" }]}>
          <Ionicons name="checkmark-circle" size={16} color="#7BE0B8" />
          <Text style={[dcStyles.doneText, { color: "#7BE0B8" }]}>Workout complete — great work!</Text>
        </View>
      ) : null}
    </View>
  );
}

const dcStyles = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 20, overflow: "hidden" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  xpPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  xpText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  workoutName: { fontSize: 20, fontFamily: "Poppins_700Bold", letterSpacing: -0.4, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  dot: { width: 3, height: 3, borderRadius: 2 },
  progressWrap: { gap: 6, marginBottom: 14 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  exerciseList: { gap: 8, marginBottom: 14 },
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  exInfo: { flex: 1 },
  exName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  exSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14 },
  startBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 14, borderWidth: 1 },
  doneText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

function GhostCard({ userStats, colors }: { userStats: any; colors: any }) {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== "web" }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: Platform.OS !== "web", friction: 8 }),
    ]).start();
  }, []);

  const ahead = userStats.totalWorkouts > GHOST_STATS.sessions;
  const diffCal = userStats.caloriesBurned - GHOST_STATS.calories;

  return (
    <Animated.View style={[{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.ghostCard, { backgroundColor: colors.card, borderColor: "#A78BFA40" }]}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#A78BFA12", "#8FB8FF08", "transparent"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.ghostHeader}>
          <View style={[styles.ghostBadge, { backgroundColor: "#A78BFA20", borderColor: "#A78BFA40" }]}>
            <Ionicons name="person-outline" size={12} color="#A78BFA" />
            <Text style={[styles.ghostBadgeText, { color: "#A78BFA" }]}>GHOST MODE</Text>
          </View>
          <Text style={[styles.ghostSub, { color: colors.mutedForeground }]}>vs. Last Week</Text>
        </View>

        <View style={styles.ghostCompare}>
          <View style={styles.ghostCol}>
            <Text style={[styles.ghostColLabel, { color: colors.mutedForeground }]}>Last Week</Text>
            <Text style={[styles.ghostColVal, { color: colors.mutedForeground }]}>{GHOST_STATS.sessions} sessions</Text>
            <Text style={[styles.ghostColSub, { color: colors.mutedForeground }]}>{GHOST_STATS.calories} cal</Text>
          </View>

          <View style={styles.ghostVsDivider}>
            <View style={[styles.ghostVsLine, { backgroundColor: "#A78BFA40" }]} />
            <View style={[styles.ghostVsCircle, { backgroundColor: "#A78BFA20", borderColor: "#A78BFA60" }]}>
              <Text style={[styles.ghostVsText, { color: "#A78BFA" }]}>VS</Text>
            </View>
            <View style={[styles.ghostVsLine, { backgroundColor: "#A78BFA40" }]} />
          </View>

          <View style={[styles.ghostCol, { alignItems: "flex-end" }]}>
            <Text style={[styles.ghostColLabel, { color: colors.primary }]}>You Now</Text>
            <Text style={[styles.ghostColVal, { color: colors.foreground }]}>{userStats.totalWorkouts} sessions</Text>
            <Text style={[styles.ghostColSub, { color: colors.foreground }]}>{userStats.caloriesBurned} cal</Text>
          </View>
        </View>

        <View style={[styles.ghostResult, {
          backgroundColor: ahead ? colors.success + "15" : colors.accent + "15",
          borderColor: ahead ? colors.success + "30" : colors.accent + "30",
        }]}>
          <Ionicons
            name={ahead ? "trending-up" : "trending-down"}
            size={14}
            color={ahead ? colors.success : colors.accent}
          />
          <Text style={[styles.ghostResultText, { color: ahead ? colors.success : colors.accent }]}>
            {ahead
              ? `You're ahead! +${diffCal} cal more than last week.`
              : "You're behind last week's pace. Push harder today."
            }
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    userProfile, userStats, level, rank, xpProgress,
    todaysWorkouts, scheduledWorkouts, healthMetrics,
    showReward, rewardData, unreadCount,
    completeWorkout, skipWorkout, dismissReward,
  } = useFitness();
  const [showAI, setShowAI] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestionIdx] = useState(() => Math.floor(Math.random() * AI_SUGGESTIONS.length));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const today = new Date().toISOString().split("T")[0];
  const completedToday = scheduledWorkouts.filter((sw) => sw.date === today && sw.completed).length;
  const todayCalories = healthMetrics.find((h) => h.date === today)?.calories ?? 0;

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 12, paddingBottom: 120 }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
            <Text style={[styles.name, { color: colors.foreground }]}>{userProfile.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push("/notifications" as any)}
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={[styles.streakBadge, { backgroundColor: "#F3D27A18", borderColor: "#F3D27A35" }]}>
              <Ionicons name="flame" size={14} color="#F3D27A" />
              <Text style={[styles.streakNum, { color: "#F3D27A" }]}>{userStats.streak}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.xpCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <XPProgressBar xp={userStats.xp} level={level} rank={rank} xpProgress={xpProgress} />
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="flame-outline" label="Calories" value={`${todayCalories}`} subValue="today" color={colors.accent} />
          <StatCard icon="time-outline" label="Minutes" value={`${userStats.totalMinutes}`} subValue="total" color={colors.primary} />
          <StatCard icon="barbell-outline" label="Workouts" value={`${userStats.totalWorkouts}`} subValue="done" color={colors.success} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Daily Workout</Text>
          <View style={[styles.aiBadge, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="sparkles" size={10} color={colors.primary} />
            <Text style={[styles.aiLabel2, { color: colors.primary }]}>AI Curated</Text>
          </View>
        </View>

        <DailyCuratedWorkoutCard />

        <GhostCard userStats={userStats} colors={colors} />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Scheduled Today</Text>
          <View style={[styles.countChip, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>
              {completedToday}/{todaysWorkouts.length + completedToday} done
            </Text>
          </View>
        </View>

        {todaysWorkouts.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle" size={36} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All done!</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              You've crushed every workout today. Go recover.
            </Text>
          </View>
        ) : (
          <View style={styles.swipeHint}>
            <Feather name="arrow-left" size={12} color={colors.mutedForeground} />
            <Text style={[styles.hintLabel, { color: colors.mutedForeground }]}>Swipe to skip or complete</Text>
            <Feather name="arrow-right" size={12} color={colors.mutedForeground} />
          </View>
        )}

        {todaysWorkouts.map((sw) => {
          const workout = SAMPLE_WORKOUTS.find((w) => w.id === sw.workoutId);
          if (!workout) return null;
          return (
            <WorkoutSwipeCard
              key={sw.id}
              workout={workout}
              scheduledId={sw.id}
              onComplete={completeWorkout}
              onSkip={skipWorkout}
              onPress={(w) => router.push(`/workout/${w.id}` as any)}
            />
          );
        })}

        <TouchableOpacity
          onPress={() => setShowAI(true)}
          style={[styles.aiCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary + "12", "transparent"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.aiCardContent}>
            <View style={[styles.aiAvatarWrap, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name="fitness" size={20} color={colors.primary} />
            </View>
            <View style={styles.aiText}>
              <Text style={[styles.aiTitle, { color: colors.primary }]}>AI Coach Insight</Text>
              <Text style={[styles.aiSuggestion, { color: colors.foreground }]}>{AI_SUGGESTIONS[suggestionIdx]}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Smart Recommendations</Text>
          <View style={[styles.aiBadge, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="sparkles" size={10} color={colors.primary} />
            <Text style={[styles.aiLabel2, { color: colors.primary }]}>AI Curated</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recsScroll} contentContainerStyle={styles.recsContent}>
          {SMART_RECS.map((rec) => (
            <TouchableOpacity
              key={rec.id}
              onPress={() => setShowAI(true)}
              style={[styles.recCard, { backgroundColor: colors.card, borderColor: rec.color + "30" }]}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[rec.color + "18", "transparent"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <View style={[styles.recIcon, { backgroundColor: rec.color + "20" }]}>
                <Ionicons name={rec.icon} size={20} color={rec.color} />
              </View>
              <Text style={[styles.recName, { color: colors.foreground }]}>{rec.name}</Text>
              <View style={[styles.recTag, { backgroundColor: rec.color + "15" }]}>
                <Text style={[styles.recTagText, { color: rec.color }]}>{rec.tag}</Text>
              </View>
              <View style={styles.recMeta}>
                <Ionicons name="time-outline" size={11} color={colors.mutedForeground} />
                <Text style={[styles.recMetaText, { color: colors.mutedForeground }]}>{rec.minutes}m</Text>
                <View style={[styles.recXp, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.recXpText, { color: colors.primary }]}>+{rec.xp} XP</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
        </View>

        {scheduledWorkouts
          .filter((sw) => sw.completed)
          .slice(0, 3)
          .map((sw) => {
            const workout = SAMPLE_WORKOUTS.find((w) => w.id === sw.workoutId);
            if (!workout) return null;
            return (
              <View key={sw.id} style={[styles.activityRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.activityDot, { backgroundColor: colors.success }]} />
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityName, { color: colors.foreground }]}>{workout.name}</Text>
                  <Text style={[styles.activitySub, { color: colors.mutedForeground }]}>
                    {workout.durationMinutes}m · {workout.calories} cal · +{workout.xpReward} XP
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              </View>
            );
          })}
      </ScrollView>

      <TouchableOpacity onPress={() => setShowAI(true)} style={[styles.fab, { backgroundColor: colors.primary }]}>
        <Ionicons name="chatbubble-ellipses" size={22} color="#0D0D0D" />
      </TouchableOpacity>

      <AIChatModal visible={showAI} onClose={() => setShowAI(false)} />
      <RewardOverlay visible={showReward} data={rewardData} onDismiss={dismissReward} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular" },
  name: { fontSize: 22, fontFamily: "Poppins_700Bold", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, position: "relative" },
  badge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  streakNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  xpCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  ghostCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 20, overflow: "hidden" },
  ghostHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  ghostBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  ghostBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  ghostSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  ghostCompare: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  ghostCol: { flex: 1, gap: 4 },
  ghostColLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  ghostColVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  ghostColSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ghostVsDivider: { flexDirection: "column", alignItems: "center", gap: 4, paddingHorizontal: 12 },
  ghostVsLine: { width: 1, height: 20 },
  ghostVsCircle: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  ghostVsText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  ghostResult: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 10 },
  ghostResultText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontFamily: "Poppins_600SemiBold", letterSpacing: -0.3 },
  countChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  aiLabel2: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  swipeHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12 },
  hintLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", gap: 10, marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  aiCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 24, overflow: "hidden" },
  aiCardContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiAvatarWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  aiText: { flex: 1 },
  aiTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 3 },
  aiSuggestion: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  recsScroll: { marginBottom: 24, marginHorizontal: -20 },
  recsContent: { paddingHorizontal: 20, gap: 12 },
  recCard: { width: 160, borderRadius: 18, borderWidth: 1, padding: 14, gap: 8, overflow: "hidden" },
  recIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  recName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  recTag: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  recTagText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  recMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  recMetaText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  recXp: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  recXpText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  activitySub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  fab: { position: "absolute", right: 20, bottom: 110, width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: "#8FB8FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
});
