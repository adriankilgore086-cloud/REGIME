import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, RefreshControl, Animated, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@shared/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS, Exercise, type Workout, type WorkoutCategory } from "@features/gamification/constants/workouts";
import { getWorkoutAccent } from "@shared/theme/workoutAccents";
import { resolveWorkoutDisplay } from "@/lib/workoutDisplay";
import { rankWorkoutsForUser, pickDailyCurated, buildWorkoutAiOverview } from "@/lib/smartRecommendations";
import { AIWorkoutOverviewSheet } from "@features/ai-coach/components/AIWorkoutOverviewSheet";
import { WorkoutSwipeCard } from "@features/workout/components/WorkoutSwipeCard";
import { XPProgressBar } from "@shared/components/ui/XPProgressBar";
import { StatCard } from "@shared/components/ui/StatCard";
import { RewardOverlay } from "@shared/components/ui/RewardOverlay";
import { AIChatModal } from "@features/ai-coach/components/AIChatModal";
import { WorkoutPlayerModal } from "@features/workout/components/WorkoutPlayerModal";

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

const PR_BOARD = [
  { lift: "Bench Press", current: 100, prev: 90, unit: "kg", icon: "barbell-outline" as const, color: "#FF2D78" },
  { lift: "Back Squat", current: 130, prev: 125, unit: "kg", icon: "body-outline" as const, color: "#A78BFA" },
  { lift: "Deadlift", current: 160, prev: 155, unit: "kg", icon: "fitness-outline" as const, color: "#F3D27A" },
  { lift: "OHP", current: 72, prev: 70, unit: "kg", icon: "arrow-up-outline" as const, color: "#7BE0B8" },
  { lift: "Pull-ups", current: 15, prev: 12, unit: "reps", icon: "trending-up-outline" as const, color: "#8FB8FF" },
];

function recCategoryIcon(cat: WorkoutCategory): keyof typeof Ionicons.glyphMap {
  switch (cat) {
    case "strength": return "barbell-outline";
    case "cardio": return "heart-outline";
    case "hiit": return "flash-outline";
    case "recovery": return "leaf-outline";
    case "running": return "walk-outline";
    default: return "fitness-outline";
  }
}

function DailyCuratedWorkoutCard({
  workout,
  displayName,
  accentCategory,
  onOpenOverview,
  onStartPlayer,
}: {
  workout: Workout;
  displayName: string;
  accentCategory: WorkoutCategory;
  onOpenOverview: () => void;
  onStartPlayer: (w: Workout) => void;
}) {
  const colors = useColors();
  const accent = getWorkoutAccent(colors, accentCategory);

  return (
    <View style={[dcStyles.card, { backgroundColor: colors.card, borderColor: accent.main + "35" }]}>
      <TouchableOpacity activeOpacity={0.92} onPress={onOpenOverview} style={dcStyles.touchMain}>
        <LinearGradient
          pointerEvents="none"
          colors={[accent.subtleFill, accent.main + "06", "transparent"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={dcStyles.topRow}>
          <View style={[dcStyles.badge, { backgroundColor: accent.chipBg, borderColor: accent.chipBorder }]}>
            <Ionicons name="sparkles" size={10} color={accent.main} />
            <Text style={[dcStyles.badgeText, { color: accent.main }]}>AI CURATED FOR TODAY</Text>
          </View>
          <View style={[dcStyles.xpPill, { backgroundColor: colors.primary + "18" }]}>
            <Text style={[dcStyles.xpText, { color: colors.primary }]}>+{workout.xpReward} XP</Text>
          </View>
        </View>

        <Text style={[dcStyles.workoutName, { color: colors.foreground }]}>{displayName}</Text>

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
          <Text style={[dcStyles.metaText, { color: accent.main }]}>
            {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
          </Text>
        </View>

        <View style={dcStyles.exercisePreview}>
          {workout.exercises.slice(0, 3).map((ex: Exercise) => (
            <View key={ex.id} style={[dcStyles.exPreviewRow, { borderColor: colors.border }]}>
              <View style={[dcStyles.exPreviewDot, { backgroundColor: accent.main }]} />
              <Text style={[dcStyles.exPreviewName, { color: colors.foreground }]}>{ex.name}</Text>
              <Text style={[dcStyles.exPreviewMeta, { color: colors.mutedForeground }]}>
                {ex.sets}×{ex.reps}
              </Text>
            </View>
          ))}
          {workout.exercises.length > 3 && (
            <Text style={[dcStyles.exMore, { color: colors.mutedForeground }]}>
              +{workout.exercises.length - 3} more exercises
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[dcStyles.startBtn, { backgroundColor: accent.main }]}
        onPress={() => onStartPlayer(workout)}
        activeOpacity={0.85}
      >
        <Ionicons name="play" size={14} color={colors.primaryForeground} />
        <Text style={[dcStyles.startBtnText, { color: colors.primaryForeground }]}>Start Session</Text>
      </TouchableOpacity>
    </View>
  );
}

const dcStyles = StyleSheet.create({
  card: { 
    borderRadius: 24, 
    borderWidth: 1, 
    padding: 26,
    marginBottom: 20,
    overflow: "hidden",
    minHeight: 220,
  },
  touchMain: { flex: 1 },

  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  xpPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  xpText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  workoutName: { fontSize: 24, fontFamily: "Poppins_700Bold", letterSpacing: -0.4, marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  dot: { width: 3, height: 3, borderRadius: 2 },
  progressWrap: { gap: 6, marginBottom: 14 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  exercisePreview: { gap: 6, marginBottom: 14 },
  exPreviewRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
  exPreviewDot: { width: 5, height: 5, borderRadius: 3 },
  exPreviewName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  exPreviewMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  exMore: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  startBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14, marginTop: 14 },
  startBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
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
    onboardingProfile, workoutLibraryCustomization,
  } = useFitness();
  const [showAI, setShowAI] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestionIdx] = useState(() => Math.floor(Math.random() * AI_SUGGESTIONS.length));
  const [playerWorkout, setPlayerWorkout] = useState<Workout | null>(null);
  const [playerScheduledId, setPlayerScheduledId] = useState<string | null>(null);
  const [overviewWorkout, setOverviewWorkout] = useState<Workout | null>(null);

  const rankedWorkouts = useMemo(
    () => rankWorkoutsForUser(SAMPLE_WORKOUTS, onboardingProfile, userProfile),
    [onboardingProfile, userProfile]
  );
  const curatedWorkout = useMemo(
    () => pickDailyCurated(rankedWorkouts, SAMPLE_WORKOUTS),
    [rankedWorkouts]
  );
  const curatedDisplay = useMemo(
    () => resolveWorkoutDisplay(curatedWorkout, workoutLibraryCustomization),
    [curatedWorkout, workoutLibraryCustomization]
  );
  const smartRecList = useMemo(() => rankedWorkouts.slice(0, 6), [rankedWorkouts]);

  const openPlayer = (workout: Workout, scheduledId?: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayerWorkout(workout);
    setPlayerScheduledId(scheduledId ?? null);
  };
  const closePlayer = () => { setPlayerWorkout(null); setPlayerScheduledId(null); };

  const openOverview = useCallback((workout: Workout) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOverviewWorkout(workout);
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const today = new Date().toISOString().split("T")[0];
  const completedToday = scheduledWorkouts.filter((sw) => sw.date === today && sw.completed).length;
  const todayCalories = healthMetrics.find((h) => h.date === today)?.calories ?? 0;

  const getWeekDates = () => {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay());
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const weekWorkouts = weekDates.filter((date) => scheduledWorkouts.some((sw) => sw.date === date && sw.completed)).length;
  const weekCalories = weekDates.reduce((sum, date) => sum + (healthMetrics.find((h) => h.date === date)?.calories ?? 0), 0);
  const weekMinutes = weekDates.reduce((sum, date) => {
    return sum + scheduledWorkouts.filter((sw) => sw.date === date && sw.completed).reduce((minSum, sw) => {
      const w = SAMPLE_WORKOUTS.find((x) => x.id === sw.workoutId);
      return minSum + (w?.durationMinutes ?? 0);
    }, 0);
  }, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#FFFFFF18", "#FFFFFF08", "transparent"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: topPad + 90 }}
        pointerEvents="none"
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad + 12, paddingBottom: 120 }]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.miniProfile, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "50" }]}>
              {userProfile.profileImage ? (
                <Image source={{ uri: userProfile.profileImage }} style={styles.miniProfileImage} />
              ) : (
                <Text style={[styles.miniProfileText, { color: colors.primary }]}>{userProfile.name.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{`${greeting}, ${userProfile.name || "Athlete"}`}</Text>
              <Text style={[styles.name, { color: colors.foreground }]}>Project Don</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push("/leaderboard" as any)}
              style={[styles.iconBtn, { backgroundColor: "#F3D27A14", borderColor: "#F3D27A35" }]}
            >
              <Ionicons name="trophy-outline" size={20} color="#F3D27A" />
            </TouchableOpacity>
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

        <TouchableOpacity onPress={() => router.push("/stats-overview" as any)}>
          <View style={[styles.xpCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <XPProgressBar xp={userStats.xp} level={level} rank={rank} xpProgress={xpProgress} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/stats-overview" as any)}>
          <View style={styles.statsRow}>
            <StatCard icon="flame-outline" label="Calories" value={`${todayCalories}`} subValue="today" color={colors.accent} />
            <StatCard icon="time-outline" label="Minutes" value={`${userStats.totalMinutes}`} subValue="total" color={colors.primary} />
            <StatCard icon="barbell-outline" label="Workouts" value={`${userStats.totalWorkouts}`} subValue="done" color={colors.success} />
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Daily Workout</Text>
          <View style={[styles.aiBadge, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="sparkles" size={10} color={colors.primary} />
            <Text style={[styles.aiLabel2, { color: colors.primary }]}>AI Curated</Text>
          </View>
        </View>

        <DailyCuratedWorkoutCard
          workout={curatedWorkout}
          displayName={curatedDisplay.displayName}
          accentCategory={curatedDisplay.accentCategory}
          onOpenOverview={() => openOverview(curatedWorkout)}
          onStartPlayer={(w) => openPlayer(w)}
        />

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
          const display = resolveWorkoutDisplay(workout, workoutLibraryCustomization);
          return (
            <WorkoutSwipeCard
              key={sw.id}
              workout={workout}
              scheduledId={sw.id}
              onComplete={completeWorkout}
              onSkip={skipWorkout}
              onPress={(w) => openPlayer(w, sw.id)}
              displayName={display.displayName}
              accentCategory={display.accentCategory}
            />
          );
        })}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week</Text>
        </View>

        <TouchableOpacity onPress={() => router.push("/stats-overview" as any)}>
          <View style={[styles.weekWidget, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.weekStatCol}>
              <View style={[styles.weekStatIcon, { backgroundColor: colors.success + "20" }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
              </View>
              <Text style={[styles.weekStatLabel, { color: colors.mutedForeground }]}>Workouts</Text>
              <Text style={[styles.weekStatValue, { color: colors.foreground }]}>{weekWorkouts}</Text>
              <Text style={[styles.weekStatSub, { color: colors.mutedForeground }]}>this week</Text>
            </View>
            <View style={[styles.weekStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.weekStatCol}>
              <View style={[styles.weekStatIcon, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.weekStatLabel, { color: colors.mutedForeground }]}>Minutes</Text>
              <Text style={[styles.weekStatValue, { color: colors.foreground }]}>{weekMinutes}</Text>
              <Text style={[styles.weekStatSub, { color: colors.mutedForeground }]}>this week</Text>
            </View>
            <View style={[styles.weekStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.weekStatCol}>
              <View style={[styles.weekStatIcon, { backgroundColor: colors.accent + "20" }]}>
                <Ionicons name="flame-outline" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.weekStatLabel, { color: colors.mutedForeground }]}>Calories</Text>
              <Text style={[styles.weekStatValue, { color: colors.foreground }]}>{weekCalories}</Text>
              <Text style={[styles.weekStatSub, { color: colors.mutedForeground }]}>this week</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openOverview(curatedWorkout)}
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

        <TouchableOpacity onPress={() => router.push("/stats-overview" as any)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Personal Records</Text>
            <View style={[styles.aiBadge, { backgroundColor: "#F3D27A15" }]}>
              <Ionicons name="trophy-outline" size={10} color="#F3D27A" />
              <Text style={[styles.aiLabel2, { color: "#F3D27A" }]}>Your PRs</Text>
            </View>
          </View>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recsScroll} contentContainerStyle={styles.recsContent}>
          {PR_BOARD.map((pr) => {
            const gain = pr.current - pr.prev;
            const gainPct = Math.round((gain / pr.prev) * 100);
            return (
              <TouchableOpacity 
                key={pr.lift} 
                onPress={() => router.push("/stats-overview" as any)}
                style={[prStyles.card, { backgroundColor: colors.card, borderColor: pr.color + "30" }]}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[pr.color + "14", "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
                <View style={[prStyles.iconWrap, { backgroundColor: pr.color + "20" }]}>
                  <Ionicons name={pr.icon} size={18} color={pr.color} />
                </View>
                <Text style={[prStyles.liftName, { color: colors.mutedForeground }]}>{pr.lift}</Text>
                <Text style={[prStyles.prVal, { color: colors.foreground }]}>
                  {pr.current}
                  <Text style={[prStyles.unit, { color: colors.mutedForeground }]}> {pr.unit}</Text>
                </Text>
                <View style={[prStyles.badge, { backgroundColor: pr.color + "20", borderColor: pr.color + "35" }]}>
                  <Ionicons name="arrow-up" size={9} color={pr.color} />
                  <Text style={[prStyles.badgeText, { color: pr.color }]}>+{gain} ({gainPct}%)</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity onPress={() => router.push("/stats-overview" as any)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Smart Recommendations</Text>
            <View style={[styles.aiBadge, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="sparkles" size={10} color={colors.primary} />
              <Text style={[styles.aiLabel2, { color: colors.primary }]}>AI Curated</Text>
            </View>
          </View>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recsScroll} contentContainerStyle={styles.recsContent}>
          {smartRecList.map((rec) => {
            const { displayName, accentCategory } = resolveWorkoutDisplay(rec, workoutLibraryCustomization);
            const ac = getWorkoutAccent(colors, accentCategory);
            const iconName = recCategoryIcon(accentCategory);
            const tag =
              rec.category === "recovery"
                ? "Recovery bias"
                : rec.category === "strength"
                  ? "Strength match"
                  : rec.category === "hiit"
                    ? "Metabolic push"
                    : "AI ranked";
            return (
              <TouchableOpacity
                key={rec.id}
                onPress={() => openOverview(rec)}
                style={[styles.recCard, { backgroundColor: colors.card, borderColor: ac.main + "30" }]}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[ac.subtleFill, "transparent"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
                <View style={[styles.recIcon, { backgroundColor: ac.chipBg }]}>
                  <Ionicons name={iconName} size={20} color={ac.main} />
                </View>
                <Text style={[styles.recName, { color: colors.foreground }]} numberOfLines={2}>
                  {displayName}
                </Text>
                <View style={[styles.recTag, { backgroundColor: ac.main + "15" }]}>
                  <Text style={[styles.recTagText, { color: ac.main }]}>{tag}</Text>
                </View>
                <View style={styles.recMeta}>
                  <Ionicons name="time-outline" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.recMetaText, { color: colors.mutedForeground }]}>
                    {rec.durationMinutes}m
                  </Text>
                  <View style={[styles.recXp, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.recXpText, { color: colors.primary }]}>+{rec.xpReward} XP</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
            const actDisplay = resolveWorkoutDisplay(workout, workoutLibraryCustomization);
            return (
              <View key={sw.id} style={[styles.activityRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.activityDot, { backgroundColor: colors.success }]} />
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityName, { color: colors.foreground }]}>{actDisplay.displayName}</Text>
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
      {playerWorkout && (
        <WorkoutPlayerModal
          visible={!!playerWorkout}
          workout={playerWorkout}
          scheduledId={playerScheduledId}
          onClose={closePlayer}
          onComplete={(sid) => { completeWorkout(sid); closePlayer(); }}
        />
      )}

      <AIWorkoutOverviewSheet
        visible={overviewWorkout !== null}
        title={overviewWorkout ? resolveWorkoutDisplay(overviewWorkout, workoutLibraryCustomization).displayName : ""}
        subtitle="Personalized from your onboarding answers"
        body={
          overviewWorkout
            ? buildWorkoutAiOverview(overviewWorkout, onboardingProfile, userProfile)
            : ""
        }
        onClose={() => setOverviewWorkout(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  miniProfile: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1.5, overflow: "hidden", flexShrink: 0 },
  miniProfileImage: { width: 52, height: 52, borderRadius: 14 },
  miniProfileText: { fontSize: 22, fontFamily: "Inter_700Bold" },
  greeting: { fontSize: 14, fontFamily: "Inter_500Medium" },
  name: { fontSize: 22, fontFamily: "Poppins_700Bold", letterSpacing: -0.5, marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, position: "relative" },
  badge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  streakNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  xpCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  ghostCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginTop: 10, marginBottom: 28, overflow: "hidden" },
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
  weekWidget: { borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  weekStatCol: { flex: 1, alignItems: "center", gap: 6 },
  weekStatIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  weekStatLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  weekStatValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  weekStatSub: { fontSize: 10, fontFamily: "Inter_400Regular" },
  weekStatDivider: { width: 1, height: 60 },
});

const prStyles = StyleSheet.create({
  card: { width: 140, borderRadius: 18, borderWidth: 1, padding: 14, gap: 6, overflow: "hidden" },
  iconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  liftName: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  prVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  unit: { fontSize: 12, fontFamily: "Inter_400Regular" },
  badge: { flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
});
