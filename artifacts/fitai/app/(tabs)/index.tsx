import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { SAMPLE_WORKOUTS } from "@/constants/workouts";
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
            <TouchableOpacity onPress={() => router.push("/notifications" as any)} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={[styles.streakBadge, { backgroundColor: colors.warning + "20", borderColor: colors.warning + "40" }]}>
              <Ionicons name="flame" size={14} color={colors.warning} />
              <Text style={[styles.streakNum, { color: colors.warning }]}>{userStats.streak}</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Workouts</Text>
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
            colors={[colors.primary + "15", "transparent"]}
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
        <Ionicons name="chatbubble-ellipses" size={22} color="#08081A" />
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
  name: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, position: "relative" },
  badge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  streakNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  xpCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  countChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
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
  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  activitySub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  fab: { position: "absolute", right: 20, bottom: 110, width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: "#00D4FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 10 },
});
