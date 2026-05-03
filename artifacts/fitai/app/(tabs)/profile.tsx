import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { ACHIEVEMENTS } from "@/constants/achievements";
import { RARITY_COLORS, RARITY_GLOW } from "@/constants/achievements";
import { XPProgressBar } from "@/components/XPProgressBar";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const {
    userProfile, userStats, level, rank, xpProgress,
    earnedAchievements,
  } = useFitness();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const earnedSet = new Set(earnedAchievements.map((a) => a.id));
  const earnedBadges = ACHIEVEMENTS.filter((a) => earnedSet.has(a.id));
  const lockedBadges = ACHIEVEMENTS.filter((a) => !earnedSet.has(a.id)).slice(0, 4);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topPad + 12, paddingBottom: 120 }]} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#00D4FF20", "#7B2FBE15", "transparent"]}
          style={styles.headerGrad}
        />

        <View style={styles.profileSection}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "50" }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {userProfile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{userProfile.name}</Text>
          <View style={styles.rankRow}>
            <View style={[styles.rankChip, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "40" }]}>
              <Ionicons name="flash" size={12} color={colors.primary} />
              <Text style={[styles.rankText, { color: colors.primary }]}>{rank}</Text>
            </View>
            <View style={[styles.rankChip, { backgroundColor: colors.muted }]}>
              <Text style={[styles.rankText, { color: colors.mutedForeground }]}>Level {level}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.xpCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <XPProgressBar xp={userStats.xp} level={level} rank={rank} xpProgress={xpProgress} />
        </View>

        <View style={styles.statsGrid}>
          {[
            { label: "Workouts", value: userStats.totalWorkouts.toString(), icon: "barbell-outline", color: colors.primary },
            { label: "Streak", value: `${userStats.streak}d`, icon: "flame-outline", color: colors.warning },
            { label: "Calories", value: `${Math.round(userStats.caloriesBurned / 1000)}k`, icon: "flame-outline", color: colors.accent },
            { label: "Hours", value: `${Math.round(userStats.totalMinutes / 60)}h`, icon: "time-outline", color: colors.success },
          ].map((s) => (
            <View key={s.label} style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={s.icon as any} size={18} color={s.color} />
              <Text style={[styles.gridValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.gridLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Achievements ({earnedBadges.length}/{ACHIEVEMENTS.length})
        </Text>

        {earnedBadges.length === 0 ? (
          <View style={[styles.emptyBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="trophy-outline" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Complete workouts to earn badges</Text>
          </View>
        ) : (
          <View style={styles.badgeGrid}>
            {earnedBadges.map((badge) => {
              const rarityColor = RARITY_COLORS[badge.rarity];
              const ea = earnedAchievements.find((e) => e.id === badge.id);
              return (
                <View key={badge.id} style={[styles.badgeCard, { backgroundColor: colors.card, borderColor: rarityColor + "40" }]}>
                  <View style={[styles.badgeIcon, { backgroundColor: rarityColor + "20", shadowColor: rarityColor }]}>
                    <Ionicons name={badge.icon as any} size={22} color={rarityColor} />
                  </View>
                  <Text style={[styles.badgeName, { color: colors.foreground }]} numberOfLines={1}>{badge.name}</Text>
                  <View style={[styles.rarityChip, { backgroundColor: rarityColor + "20" }]}>
                    <Text style={[styles.rarityText, { color: rarityColor }]}>{badge.rarity}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {lockedBadges.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Locked Badges</Text>
            <View style={styles.badgeGrid}>
              {lockedBadges.map((badge) => (
                <View key={badge.id} style={[styles.badgeCard, styles.lockedBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <View style={[styles.badgeIcon, { backgroundColor: colors.border }]}>
                    <Ionicons name="lock-closed" size={18} color={colors.mutedForeground} />
                  </View>
                  <Text style={[styles.badgeName, { color: colors.mutedForeground }]} numberOfLines={1}>{badge.name}</Text>
                  <Text style={[styles.rarityText, { color: colors.mutedForeground }]}>{badge.criteria.value} {badge.criteria.type}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Settings</Text>

        {[
          { icon: "person-outline", label: "Edit Profile", color: colors.primary },
          { icon: "notifications-outline", label: "Notifications", color: colors.primary },
          { icon: "shield-checkmark-outline", label: "Privacy & Security", color: colors.primary },
          { icon: "help-circle-outline", label: "Help & Support", color: colors.primary },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={[styles.settingsRow, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7}>
            <View style={[styles.settingsIcon, { backgroundColor: item.color + "15" }]}>
              <Ionicons name={item.icon as any} size={18} color={item.color} />
            </View>
            <Text style={[styles.settingsLabel, { color: colors.foreground }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.signOutBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  headerGrad: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },
  profileSection: { alignItems: "center", marginBottom: 20 },
  avatarCircle: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 2, marginBottom: 12 },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold" },
  profileName: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 8 },
  rankRow: { flexDirection: "row", gap: 8 },
  rankChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  rankText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  xpCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 16 },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 24 },
  gridCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
  gridValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  gridLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: -0.3, marginBottom: 14 },
  emptyBadge: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", gap: 10, marginBottom: 16 },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  badgeCard: { width: "47%", borderRadius: 16, borderWidth: 1, padding: 14, alignItems: "center", gap: 8 },
  lockedBadge: { opacity: 0.6 },
  badgeIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  badgeName: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  rarityChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  rarityText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  settingsRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  settingsIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingsLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16, borderWidth: 1, paddingVertical: 14, marginTop: 8 },
  signOutText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
