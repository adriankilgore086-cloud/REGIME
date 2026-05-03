import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { ACHIEVEMENTS, RARITY_COLORS } from "@/constants/achievements";
import { XPProgressBar } from "@/components/XPProgressBar";

const LEADERBOARD_DATA = [
  { rank: 1, name: "Sarah L.", xp: 8420, streak: 34, badge: "Iron Discipline", isMe: false },
  { rank: 2, name: "Marcus K.", xp: 6810, streak: 21, badge: "Elite Performer", isMe: false },
  { rank: 3, name: "Priya R.", xp: 5990, streak: 18, badge: "Endurance Champ", isMe: false },
  { rank: 4, name: "Jake T.", xp: 4250, streak: 12, badge: "The Grinder", isMe: false },
  { rank: 5, name: "You", xp: 0, streak: 0, badge: "", isMe: true },
  { rank: 6, name: "Amy W.", xp: 0, streak: 5, badge: "Consistency King", isMe: false },
  { rank: 7, name: "Chris B.", xp: 0, streak: 3, badge: "Rookie", isMe: false },
];

const SOCIAL_POSTS = [
  {
    id: "p1", user: "Sarah L.", avatar: "S", badge: "Iron Discipline",
    text: "New deadlift PR today — 120kg! 🔥 Consistent progressive overload finally paying off.",
    type: "pr", value: "120kg DL", xpEarned: 300, time: "23m ago",
    reactions: { fire: 18, flex: 7, clap: 11 },
  },
  {
    id: "p2", user: "Marcus K.", avatar: "M", badge: "Elite Performer",
    text: "Crushed a 34-day streak. Never missed a Monday this year.",
    type: "streak", value: "34 days", xpEarned: 500, time: "1h ago",
    reactions: { fire: 24, flex: 9, clap: 15 },
  },
  {
    id: "p3", user: "Priya R.", avatar: "P", badge: "Endurance Champ",
    text: "5K in 22:14 — shaved 45 seconds off my previous best. The AI pacing plan actually works.",
    type: "run", value: "22:14 5K", xpEarned: 200, time: "3h ago",
    reactions: { fire: 31, flex: 5, clap: 20 },
  },
  {
    id: "p4", user: "Jake T.", avatar: "J", badge: "The Grinder",
    text: "Week 8 of the strength program. Volume is up 30% from baseline. Feeling the gains.",
    type: "volume", value: "+30% vol", xpEarned: 150, time: "5h ago",
    reactions: { fire: 8, flex: 12, clap: 6 },
  },
  {
    id: "p5", user: "Amy W.", avatar: "A", badge: "Consistency King",
    text: "Unlocked the 'Week Warrior' badge. Every session counts.",
    type: "badge", value: "Week Warrior", xpEarned: 100, time: "8h ago",
    reactions: { fire: 14, flex: 3, clap: 9 },
  },
];

const IDENTITY_TITLES = [
  "The Grinder", "Elite Performer", "Iron Discipline", "Consistency King",
  "Endurance Champion", "Power Lifter", "Speed Demon", "Recovery Master",
];

function RankMedal({ rank }: { rank: number }) {
  const colors = ["#F3D27A", "#C0C0C0", "#CD7F32"];
  if (rank <= 3) {
    return (
      <View style={[medallStyles.circle, { backgroundColor: colors[rank - 1] + "25", borderColor: colors[rank - 1] + "60" }]}>
        <Text style={[medallStyles.text, { color: colors[rank - 1] }]}>#{rank}</Text>
      </View>
    );
  }
  return (
    <View style={[medallStyles.circle, { backgroundColor: "#FFFFFF10", borderColor: "#FFFFFF20" }]}>
      <Text style={[medallStyles.text, { color: "#FFFFFF60" }]}>#{rank}</Text>
    </View>
  );
}

const medallStyles = StyleSheet.create({
  circle: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  text: { fontSize: 12, fontFamily: "Inter_700Bold" },
});

function PostReactionRow({ reactions, postId }: { reactions: { fire: number; flex: number; clap: number }; postId: string }) {
  const colors = useColors();
  const [liked, setLiked] = useState(false);
  return (
    <View style={reactionStyles.row}>
      <TouchableOpacity onPress={() => setLiked(!liked)} style={[reactionStyles.btn, liked && { backgroundColor: "#FF2D7820" }]}>
        <Text style={reactionStyles.emoji}>🔥</Text>
        <Text style={[reactionStyles.count, { color: liked ? "#FF2D78" : colors.mutedForeground }]}>{reactions.fire + (liked ? 1 : 0)}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={reactionStyles.btn}>
        <Text style={reactionStyles.emoji}>💪</Text>
        <Text style={[reactionStyles.count, { color: colors.mutedForeground }]}>{reactions.flex}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={reactionStyles.btn}>
        <Text style={reactionStyles.emoji}>👏</Text>
        <Text style={[reactionStyles.count, { color: colors.mutedForeground }]}>{reactions.clap}</Text>
      </TouchableOpacity>
    </View>
  );
}

const reactionStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, marginTop: 10 },
  btn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: "#FFFFFF08" },
  emoji: { fontSize: 13 },
  count: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});

const TABS = ["Overview", "Social", "Leaderboard"] as const;
type Tab = typeof TABS[number];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { userProfile, userStats, level, rank, xpProgress, earnedAchievements } = useFitness();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [lbFilter, setLbFilter] = useState<"global" | "friends">("global");

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const earnedSet = new Set(earnedAchievements.map((a) => a.id));
  const earnedBadges = ACHIEVEMENTS.filter((a) => earnedSet.has(a.id));
  const lockedBadges = ACHIEVEMENTS.filter((a) => !earnedSet.has(a.id)).slice(0, 4);

  const leaderData = LEADERBOARD_DATA.map((row) =>
    row.isMe ? { ...row, xp: userStats.xp, streak: userStats.streak, badge: rank } : row
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topSection, { paddingTop: topPad + 12 }]}>
        <LinearGradient colors={["#8FB8FF15", "#A78BFA10", "transparent"]} style={StyleSheet.absoluteFill} />

        <View style={styles.profileRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "50" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{userProfile.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>{userProfile.name}</Text>
            <View style={styles.rankRow}>
              <View style={[styles.rankChip, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
                <Ionicons name="flash" size={11} color={colors.primary} />
                <Text style={[styles.rankText, { color: colors.primary }]}>{rank}</Text>
              </View>
              <View style={[styles.rankChip, { backgroundColor: "#FFFFFF10", borderColor: "#FFFFFF15" }]}>
                <Text style={[styles.rankText, { color: colors.mutedForeground }]}>Level {level}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={[styles.settingsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="log-out" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.miniStats}>
          {[
            { v: userStats.totalWorkouts.toString(), l: "Workouts", c: colors.primary },
            { v: `${userStats.streak}d`, l: "Streak", c: "#F3D27A" },
            { v: `${Math.round(userStats.totalMinutes / 60)}h`, l: "Hours", c: colors.success },
            { v: userStats.xp.toString(), l: "XP", c: "#A78BFA" },
          ].map((s) => (
            <View key={s.l} style={styles.miniStat}>
              <Text style={[styles.miniVal, { color: s.c }]}>{s.v}</Text>
              <Text style={[styles.miniLabel, { color: colors.mutedForeground }]}>{s.l}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.segmented, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.segTab, activeTab === tab && { backgroundColor: colors.card }]}
            >
              <Text style={[styles.segText, { color: activeTab === tab ? colors.foreground : colors.mutedForeground }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>

        {activeTab === "Overview" && (
          <>
            <View style={[styles.xpCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <XPProgressBar xp={userStats.xp} level={level} rank={rank} xpProgress={xpProgress} />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Achievements ({earnedBadges.length}/{ACHIEVEMENTS.length})
            </Text>

            {earnedBadges.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="trophy-outline" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Complete workouts to earn badges</Text>
              </View>
            ) : (
              <View style={[styles.badgeList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {earnedBadges.map((badge, i) => {
                  const rc = RARITY_COLORS[badge.rarity];
                  return (
                    <View key={badge.id} style={[styles.badgeRow, i < earnedBadges.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                      <View style={[styles.badgeIcon, { backgroundColor: rc + "20", shadowColor: rc }]}>
                        <Ionicons name={badge.icon as any} size={20} color={rc} />
                      </View>
                      <View style={styles.badgeInfo}>
                        <Text style={[styles.badgeName, { color: colors.foreground }]}>{badge.name}</Text>
                        <Text style={[styles.badgeDesc, { color: colors.mutedForeground }]}>{badge.description}</Text>
                      </View>
                      <View style={[styles.rarityChip, { backgroundColor: rc + "20" }]}>
                        <Text style={[styles.rarityText, { color: rc }]}>{badge.rarity}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {lockedBadges.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Locked</Text>
                <View style={[styles.badgeList, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.6 }]}>
                  {lockedBadges.map((badge, i) => (
                    <View key={badge.id} style={[styles.badgeRow, i < lockedBadges.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                      <View style={[styles.badgeIcon, { backgroundColor: colors.muted }]}>
                        <Ionicons name="lock-closed" size={16} color={colors.mutedForeground} />
                      </View>
                      <View style={styles.badgeInfo}>
                        <Text style={[styles.badgeName, { color: colors.mutedForeground }]}>{badge.name}</Text>
                        <Text style={[styles.badgeDesc, { color: colors.mutedForeground }]}>{badge.criteria.value} {badge.criteria.type}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={14} color={colors.border} />
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Identity Titles</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.titlesScroll} contentContainerStyle={styles.titlesContent}>
              {IDENTITY_TITLES.map((title, i) => {
                const earned = i < 2;
                return (
                  <View key={title} style={[styles.titleChip,
                    earned
                      ? { backgroundColor: colors.primary + "20", borderColor: colors.primary + "50" }
                      : { backgroundColor: colors.muted, borderColor: colors.border, opacity: 0.5 }
                  ]}>
                    {earned && <Ionicons name="checkmark-circle" size={12} color={colors.primary} />}
                    <Text style={[styles.titleChipText, { color: earned ? colors.primary : colors.mutedForeground }]}>{title}</Text>
                  </View>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>Settings</Text>
            {[
              { icon: "person-outline", label: "Edit Profile" },
              { icon: "notifications-outline", label: "Notifications" },
              { icon: "shield-checkmark-outline", label: "Privacy & Security" },
              { icon: "help-circle-outline", label: "Help & Support" },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={[styles.settingsRow, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.settingsLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === "Social" && (
          <>
            <View style={[styles.feedHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={["#8FB8FF10", "#A78BFA10"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
              <Ionicons name="people" size={16} color={colors.primary} />
              <Text style={[styles.feedHeaderText, { color: colors.foreground }]}>Community Feed</Text>
              <View style={[styles.liveBadge, { backgroundColor: "#FF2D7820", borderColor: "#FF2D7840" }]}>
                <View style={[styles.liveDot, { backgroundColor: "#FF2D78" }]} />
                <Text style={[styles.liveText, { color: "#FF2D78" }]}>LIVE</Text>
              </View>
            </View>

            {SOCIAL_POSTS.map((post) => (
              <View key={post.id} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.postHeader}>
                  <View style={[styles.postAvatar, { backgroundColor: colors.primary + "30", borderColor: colors.primary + "50" }]}>
                    <Text style={[styles.postAvatarText, { color: colors.primary }]}>{post.avatar}</Text>
                  </View>
                  <View style={styles.postMeta}>
                    <Text style={[styles.postUser, { color: colors.foreground }]}>{post.user}</Text>
                    <Text style={[styles.postBadge, { color: colors.mutedForeground }]}>{post.badge} · {post.time}</Text>
                  </View>
                  <View style={[styles.postXp, { backgroundColor: colors.primary + "15" }]}>
                    <Text style={[styles.postXpText, { color: colors.primary }]}>+{post.xpEarned} XP</Text>
                  </View>
                </View>

                <Text style={[styles.postText, { color: colors.foreground }]}>{post.text}</Text>

                <View style={[styles.postValueChip, {
                  backgroundColor: post.type === "pr" ? "#FF2D7815" :
                    post.type === "streak" ? "#F3D27A15" :
                      post.type === "run" ? "#8FB8FF15" : "#A78BFA15",
                  borderColor: post.type === "pr" ? "#FF2D7830" :
                    post.type === "streak" ? "#F3D27A30" :
                      post.type === "run" ? "#8FB8FF30" : "#A78BFA30",
                }]}>
                  <Text style={[styles.postValueText, {
                    color: post.type === "pr" ? "#FF2D78" :
                      post.type === "streak" ? "#F3D27A" :
                        post.type === "run" ? "#8FB8FF" : "#A78BFA",
                  }]}>{post.value}</Text>
                </View>

                <PostReactionRow reactions={post.reactions} postId={post.id} />
              </View>
            ))}
          </>
        )}

        {activeTab === "Leaderboard" && (
          <>
            <View style={styles.lbFilters}>
              {(["global", "friends"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setLbFilter(f)}
                  style={[styles.lbFilterBtn,
                    lbFilter === f
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: colors.muted, borderColor: colors.border }
                  ]}
                >
                  <Text style={[styles.lbFilterText, { color: lbFilter === f ? "#0D0D0D" : colors.mutedForeground }]}>
                    {f === "global" ? "Global" : "Friends"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.lbPodium, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={["#F3D27A10", "#A78BFA10", "transparent"]} style={StyleSheet.absoluteFill} />
              <Text style={[styles.lbPodiumTitle, { color: colors.foreground }]}>This Week's Champions</Text>
              <View style={styles.podiumRow}>
                {leaderData.slice(0, 3).map((row, i) => (
                  <View key={row.rank} style={[styles.podiumItem, i === 0 && styles.podiumCenter]}>
                    <View style={[styles.podiumAvatar, {
                      backgroundColor: i === 0 ? "#F3D27A20" : i === 1 ? "#C0C0C020" : "#CD7F3220",
                      borderColor: i === 0 ? "#F3D27A60" : i === 1 ? "#C0C0C060" : "#CD7F3260",
                    }]}>
                      <Text style={[styles.podiumAvatarText, {
                        color: i === 0 ? "#F3D27A" : i === 1 ? "#C0C0C0" : "#CD7F32",
                      }]}>{row.name.charAt(0)}</Text>
                    </View>
                    {i === 0 && <Text style={styles.crownEmoji}>👑</Text>}
                    <Text style={[styles.podiumName, { color: colors.foreground }]} numberOfLines={1}>{row.name}</Text>
                    <Text style={[styles.podiumXP, { color: colors.primary }]}>{row.xp.toLocaleString()} XP</Text>
                  </View>
                ))}
              </View>
            </View>

            {leaderData.map((row) => (
              <View key={row.rank} style={[
                styles.lbRow,
                { backgroundColor: row.isMe ? colors.primary + "15" : colors.card, borderColor: row.isMe ? colors.primary + "40" : colors.border }
              ]}>
                <RankMedal rank={row.rank} />
                <View style={[styles.lbAvatar, { backgroundColor: row.isMe ? colors.primary + "25" : colors.muted + "80" }]}>
                  <Text style={[styles.lbAvatarText, { color: row.isMe ? colors.primary : colors.mutedForeground }]}>
                    {row.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.lbInfo}>
                  <Text style={[styles.lbName, { color: row.isMe ? colors.primary : colors.foreground }]}>
                    {row.name}{row.isMe ? " (You)" : ""}
                  </Text>
                  <Text style={[styles.lbBadge, { color: colors.mutedForeground }]}>{row.badge}</Text>
                </View>
                <View style={styles.lbStats}>
                  <View style={styles.lbStatItem}>
                    <Text style={[styles.lbStatVal, { color: colors.foreground }]}>{row.xp.toLocaleString()}</Text>
                    <Text style={[styles.lbStatLabel, { color: colors.mutedForeground }]}>XP</Text>
                  </View>
                  <View style={[styles.lbStreak, { backgroundColor: "#F3D27A15" }]}>
                    <Ionicons name="flame" size={11} color="#F3D27A" />
                    <Text style={[styles.lbStreakText, { color: "#F3D27A" }]}>{row.streak}</Text>
                  </View>
                </View>
              </View>
            ))}

            <View style={[styles.lbFooter, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="refresh-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.lbFooterText, { color: colors.mutedForeground }]}>Updates every Sunday at midnight</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: { paddingHorizontal: 20, paddingBottom: 0, overflow: "hidden" },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  avatarCircle: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  avatarText: { fontSize: 24, fontFamily: "Inter_700Bold" },
  profileMeta: { flex: 1 },
  profileName: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.4, marginBottom: 6 },
  rankRow: { flexDirection: "row", gap: 6 },
  rankChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  rankText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  settingsBtn: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  miniStats: { flexDirection: "row", marginBottom: 16 },
  miniStat: { flex: 1, alignItems: "center", gap: 2 },
  miniVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  miniLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  segmented: { flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 3, marginBottom: 16 },
  segTab: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: "center" },
  segText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  xpCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontFamily: "Poppins_600SemiBold", letterSpacing: -0.3, marginBottom: 12 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", gap: 10, marginBottom: 16 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  badgeList: { borderRadius: 18, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  badgeIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
  badgeInfo: { flex: 1 },
  badgeName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  badgeDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  rarityChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  rarityText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  titlesScroll: { marginBottom: 20 },
  titlesContent: { gap: 8, paddingBottom: 4 },
  titleChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  titleChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  settingsRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  settingsIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingsLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  feedHeader: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 14, overflow: "hidden" },
  feedHeaderText: { flex: 1, fontSize: 14, fontFamily: "Inter_700Bold" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  postCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  postAvatar: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  postAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  postMeta: { flex: 1 },
  postUser: { fontSize: 14, fontFamily: "Inter_700Bold" },
  postBadge: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  postXp: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  postXpText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  postText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 10 },
  postValueChip: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  postValueText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  lbFilters: { flexDirection: "row", gap: 10, marginBottom: 14 },
  lbFilterBtn: { flex: 1, paddingVertical: 9, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  lbFilterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  lbPodium: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 14, overflow: "hidden" },
  lbPodiumTitle: { fontSize: 15, fontFamily: "Poppins_600SemiBold", textAlign: "center", marginBottom: 16 },
  podiumRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 12 },
  podiumItem: { alignItems: "center", gap: 6, flex: 1 },
  podiumCenter: { marginBottom: 8 },
  podiumAvatar: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  podiumAvatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  crownEmoji: { fontSize: 16, position: "absolute", top: -14 },
  podiumName: { fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  podiumXP: { fontSize: 11, fontFamily: "Inter_700Bold" },
  lbRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 8 },
  lbAvatar: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  lbAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  lbInfo: { flex: 1 },
  lbName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  lbBadge: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  lbStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  lbStatItem: { alignItems: "flex-end" },
  lbStatVal: { fontSize: 13, fontFamily: "Inter_700Bold" },
  lbStatLabel: { fontSize: 9, fontFamily: "Inter_400Regular" },
  lbStreak: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  lbStreakText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  lbFooter: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, borderWidth: 1, padding: 10 },
  lbFooterText: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
