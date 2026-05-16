import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@shared/hooks/useColors";
import { useFitness } from "@store/FitnessContext";
import { getLevel, getRank } from "@features/gamification/constants/workouts";

type Filter = "xp" | "streak" | "workouts";

interface LeaderEntry {
  rank: number;
  name: string;
  username: string;
  xp: number;
  streak: number;
  workouts: number;
  level: number;
  rankTitle: string;
  isYou?: boolean;
  trend: "up" | "down" | "same";
  avatarColor: string;
}

const AVATAR_COLORS = [
  "#FF2D78", "#7BE0B8", "#F3D27A", "#A78BFA",
  "#8FB8FF", "#00D4FF", "#FFB800", "#FF6B35",
];

function generateBoard(myXp: number, myStreak: number, myWorkouts: number, myName: string): LeaderEntry[] {
  const opponents: Omit<LeaderEntry, "rank" | "trend">[] = [
    { name: "Marcus Cole", username: "@marcusc", xp: 9400, streak: 28, workouts: 94, level: getLevel(9400), rankTitle: getRank(getLevel(9400)), avatarColor: "#FF2D78" },
    { name: "Ayasha Ren", username: "@ayasha_r", xp: 8800, streak: 22, workouts: 87, level: getLevel(8800), rankTitle: getRank(getLevel(8800)), avatarColor: "#7BE0B8" },
    { name: "Leo Hartmann", username: "@leoh", xp: 7200, streak: 15, workouts: 71, level: getLevel(7200), rankTitle: getRank(getLevel(7200)), avatarColor: "#F3D27A" },
    { name: "Priya Singh", username: "@priya_s", xp: 6500, streak: 18, workouts: 66, level: getLevel(6500), rankTitle: getRank(getLevel(6500)), avatarColor: "#A78BFA" },
    { name: "Dani Mercer", username: "@danimfitness", xp: 5900, streak: 11, workouts: 58, level: getLevel(5900), rankTitle: getRank(getLevel(5900)), avatarColor: "#8FB8FF" },
    { name: "Kai Tanaka", username: "@kai_t", xp: 4700, streak: 9, workouts: 47, level: getLevel(4700), rankTitle: getRank(getLevel(4700)), avatarColor: "#00D4FF" },
    { name: "Sara Bloom", username: "@sara_bloom", xp: 3900, streak: 7, workouts: 40, level: getLevel(3900), rankTitle: getRank(getLevel(3900)), avatarColor: "#FFB800" },
    { name: "Omar Khalid", username: "@omk", xp: 2800, streak: 5, workouts: 29, level: getLevel(2800), rankTitle: getRank(getLevel(2800)), avatarColor: "#FF6B35" },
    { name: "Ines Carvalho", username: "@inesfit", xp: 1500, streak: 3, workouts: 15, level: getLevel(1500), rankTitle: getRank(getLevel(1500)), avatarColor: "#A78BFA" },
  ];

  const me: Omit<LeaderEntry, "rank" | "trend"> = {
    name: myName || "You",
    username: "@you",
    xp: Math.max(myXp, 0),
    streak: myStreak,
    workouts: myWorkouts,
    level: getLevel(myXp),
    rankTitle: getRank(getLevel(myXp)),
    isYou: true,
    avatarColor: "#FFFFFF",
  };

  const all = [...opponents, me];
  return all
    .sort((a, b) => b.xp - a.xp)
    .map((entry, i) => ({
      ...entry,
      rank: i + 1,
      trend: entry.isYou ? "same" : i < 4 ? "up" : i > 6 ? "down" : "same",
    }));
}

function MedalBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Text style={medal.icon}>🥇</Text>;
  if (rank === 2) return <Text style={medal.icon}>🥈</Text>;
  if (rank === 3) return <Text style={medal.icon}>🥉</Text>;
  return (
    <View style={medal.numWrap}>
      <Text style={medal.num}>{rank}</Text>
    </View>
  );
}

const medal = StyleSheet.create({
  icon: { fontSize: 22, width: 36, textAlign: "center" },
  numWrap: { width: 36, alignItems: "center" },
  num: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#555" },
});

function PodiumCard({ entry, catColor }: { entry: LeaderEntry; catColor: string }) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = (entry.rank - 1) * 80;
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(opacAnim, { toValue: 1, duration: 350, useNativeDriver: Platform.OS !== "web" }),
      ]).start();
    }, delay);
  }, []);

  const isFirst = entry.rank === 1;
  const isSecondOrThird = entry.rank === 2 || entry.rank === 3;
  const color = entry.isYou ? "#FFFFFF" : entry.avatarColor;

  return (
    <Animated.View
      style={[
        { opacity: opacAnim, transform: [{ scale: scaleAnim }] },
        isFirst && pod.firstWrap,
        isSecondOrThird && pod.sideWrap,
      ]}
    >
      <View style={[
        pod.card,
        { backgroundColor: colors.card, borderColor: entry.isYou ? color + "60" : color + "30" },
        isFirst && pod.firstCard,
        isSecondOrThird && pod.sideCard,
      ]}>
        <LinearGradient
          colors={[color + (isFirst ? "22" : "12"), "transparent"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
        <MedalBadge rank={entry.rank} />
        <View style={[pod.avatar, { backgroundColor: color + "25", borderColor: color + "60" }]}>
          <Text style={[pod.avatarLetter, { color }]}>{entry.name[0]}</Text>
        </View>
        <Text style={[pod.name, { color: colors.foreground }, entry.isYou && { color }]} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={[pod.username, { color: colors.mutedForeground }]} numberOfLines={1}>
          {entry.username}
        </Text>
        <View style={[pod.xpPill, { backgroundColor: color + "20" }]}>
          <Ionicons name="star" size={10} color={color} />
          <Text style={[pod.xpText, { color }]}>{entry.xp.toLocaleString()} XP</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const pod = StyleSheet.create({
  firstWrap: { marginTop: -30, zIndex: 4 },
  sideWrap: { marginTop: 14, marginHorizontal: -10, zIndex: 2 },
  card: {
    borderRadius: 20, borderWidth: 1, padding: 14,
    alignItems: "center", gap: 6, overflow: "hidden",
    minWidth: 108,
  },
  firstCard: { borderRadius: 26, paddingVertical: 22, paddingHorizontal: 18, minWidth: 130 },
  sideCard: { minWidth: 104 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  avatarLetter: { fontSize: 18, fontFamily: "Inter_700Bold" },
  name: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: -0.2, textAlign: "center" },
  username: { fontSize: 10, fontFamily: "Inter_400Regular" },
  xpPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 2,
  },
  xpText: { fontSize: 11, fontFamily: "Inter_700Bold" },
});

function LeaderRow({ entry, filter, index }: { entry: LeaderEntry; filter: Filter; index: number }) {
  const colors = useColors();
  const translateY = useRef(new Animated.Value(20)).current;
  const opacAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 40;
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(opacAnim, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== "web" }),
      ]).start();
    }, delay);
  }, []);

  const color = entry.isYou ? "#FFFFFF" : entry.avatarColor;
  const value = filter === "xp"
    ? `${entry.xp.toLocaleString()} XP`
    : filter === "streak"
    ? `${entry.streak}d streak`
    : `${entry.workouts} workouts`;

  const trendColor = entry.trend === "up" ? "#7BE0B8" : entry.trend === "down" ? "#FF2D78" : colors.mutedForeground;
  const trendIcon = entry.trend === "up" ? "trending-up" : entry.trend === "down" ? "trending-down" : "remove";

  return (
    <Animated.View style={{ opacity: opacAnim, transform: [{ translateY }] }}>
      <View style={[
        row.wrap,
        {
          backgroundColor: entry.isYou ? color + "10" : colors.card,
          borderColor: entry.isYou ? color + "40" : colors.border,
        },
      ]}>
        {entry.isYou && (
          <LinearGradient
            colors={["rgba(255,255,255,0.06)", "transparent"]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={row.rankCol}>
          <MedalBadge rank={entry.rank} />
        </View>
        <View style={[row.avatar, { backgroundColor: color + "20", borderColor: color + "40" }]}>
          <Text style={[row.avatarLetter, { color }]}>{entry.name[0]}</Text>
        </View>
        <View style={row.info}>
          <View style={row.nameRow}>
            <Text style={[row.name, { color: entry.isYou ? color : colors.foreground }]} numberOfLines={1}>
              {entry.name}
            </Text>
            {entry.isYou && (
              <View style={[row.youTag, { backgroundColor: "#FFFFFF20" }]}>
                <Text style={row.youText}>YOU</Text>
              </View>
            )}
          </View>
          <Text style={[row.level, { color: colors.mutedForeground }]}>
            Lv.{entry.level} · {entry.rankTitle}
          </Text>
        </View>
        <View style={row.valueCol}>
          <Text style={[row.value, { color: entry.isYou ? color : colors.foreground }]}>{value}</Text>
          <View style={row.trendRow}>
            <Ionicons name={trendIcon as any} size={11} color={trendColor} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, borderWidth: 1,
    padding: 12, gap: 10, marginBottom: 8,
    overflow: "hidden",
  },
  rankCol: { width: 36, alignItems: "center" },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  avatarLetter: { fontSize: 16, fontFamily: "Inter_700Bold" },
  info: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 14, fontFamily: "Inter_600SemiBold", letterSpacing: -0.2 },
  youTag: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  youText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#FFFFFF", letterSpacing: 0.8 },
  level: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  valueCol: { alignItems: "flex-end", gap: 2 },
  value: { fontSize: 13, fontFamily: "Inter_700Bold" },
  trendRow: { flexDirection: "row", alignItems: "center" },
});

function MyStatsCard({ entry, colors }: { entry: LeaderEntry; colors: ReturnType<typeof useColors> }) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: Platform.OS !== "web" }).start();
  }, []);

  const above = entry.rank > 1 ? `${entry.rank - 1} above you` : "You're #1!";

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={[mycard.wrap, { backgroundColor: colors.card, borderColor: "#FFFFFF30" }]}>
        <LinearGradient
          colors={["rgba(255,255,255,0.08)", "transparent"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <View style={mycard.top}>
          <View>
            <Text style={[mycard.label, { color: colors.mutedForeground }]}>YOUR RANKING</Text>
            <Text style={[mycard.rank, { color: colors.foreground }]}>#{entry.rank}</Text>
          </View>
          <View style={mycard.divider} />
          <View style={mycard.statsGrid}>
            <View style={mycard.stat}>
              <Text style={[mycard.statVal, { color: colors.foreground }]}>{entry.xp.toLocaleString()}</Text>
              <Text style={[mycard.statLabel, { color: colors.mutedForeground }]}>XP</Text>
            </View>
            <View style={mycard.stat}>
              <Text style={[mycard.statVal, { color: colors.foreground }]}>{entry.streak}</Text>
              <Text style={[mycard.statLabel, { color: colors.mutedForeground }]}>STREAK</Text>
            </View>
            <View style={mycard.stat}>
              <Text style={[mycard.statVal, { color: colors.foreground }]}>{entry.workouts}</Text>
              <Text style={[mycard.statLabel, { color: colors.mutedForeground }]}>SESSIONS</Text>
            </View>
          </View>
        </View>
        <View style={[mycard.footer, { borderTopColor: "#FFFFFF15" }]}>
          <Ionicons name="people-outline" size={13} color={colors.mutedForeground} />
          <Text style={[mycard.footerText, { color: colors.mutedForeground }]}>
            {entry.rank === 1 ? "You hold the top spot — defend it." : `${above} — close the gap with today's session.`}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const mycard = StyleSheet.create({
  wrap: { borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 20, overflow: "hidden" },
  top: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 14 },
  label: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 4 },
  rank: { fontSize: 40, fontFamily: "Poppins_700Bold", letterSpacing: -2, lineHeight: 44 },
  divider: { width: 1, height: 44, backgroundColor: "#FFFFFF15" },
  statsGrid: { flex: 1, flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center", gap: 2 },
  statVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2 },
  footer: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, paddingTop: 12 },
  footerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});

const FILTERS: { key: Filter; label: string }[] = [
  { key: "xp", label: "XP" },
  { key: "streak", label: "Streak" },
  { key: "workouts", label: "Sessions" },
];

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userStats, userProfile } = useFitness();
  const [filter, setFilter] = useState<Filter>("xp");
  const topPad = Platform.OS === "web" ? 20 : insets.top;

  const board = generateBoard(
    userStats.xp,
    userStats.streak,
    userStats.totalWorkouts,
    userProfile.name || "You",
  );

  const sorted = [...board].sort((a, b) => {
    if (filter === "xp") return b.xp - a.xp;
    if (filter === "streak") return b.streak - a.streak;
    return b.workouts - a.workouts;
  }).map((e, i) => ({ ...e, rank: i + 1 }));

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const me = sorted.find((e) => e.isYou)!;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#F3D27A14", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.25 }}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.foreground }]}>Leaderboard</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>Week of May 3</Text>
        </View>
        <View style={[styles.goldBadge, { backgroundColor: "#F3D27A18", borderColor: "#F3D27A35" }]}>
          <Ionicons name="trophy" size={14} color="#F3D27A" />
          <Text style={[styles.goldText, { color: "#F3D27A" }]}>Weekly</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterBtn,
              filter === f.key && { backgroundColor: colors.foreground },
            ]}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.filterText,
              { color: filter === f.key ? colors.background : colors.mutedForeground },
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 32 : insets.bottom) + 80 }]}
      >
        {/* My stats summary */}
        <MyStatsCard entry={me} colors={colors} />

        {/* Podium — top 3 */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TOP 3</Text>
        <View style={styles.podiumRow}>
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry) => (
            <PodiumCard key={entry.rank} entry={entry} catColor="#F3D27A" />
          ))}
        </View>

        {/* Rest of board */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 24 }]}>FULL RANKINGS</Text>
        {rest.map((entry, i) => (
          <LeaderRow key={entry.name} entry={entry} filter={filter} index={i} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 16, gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
  headerCenter: { flex: 1 },
  title: { fontSize: 20, fontFamily: "Poppins_700Bold", letterSpacing: -0.4 },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  goldBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1,
  },
  goldText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  filterRow: {
    flexDirection: "row", marginHorizontal: 20, borderRadius: 14,
    borderWidth: 1, padding: 4, marginBottom: 20,
  },
  filterBtn: {
    flex: 1, alignItems: "center", paddingVertical: 8,
    borderRadius: 10,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 20 },
  sectionLabel: {
    fontSize: 10, fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5, marginBottom: 12,
  },
  podiumRow: {
    flexDirection: "row", justifyContent: "center",
    alignItems: "flex-end", gap: 8,
  },
});
