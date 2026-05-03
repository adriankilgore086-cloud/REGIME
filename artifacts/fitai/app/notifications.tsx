import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

type NotifType = "streak" | "achievement" | "workout" | "ai" | "social" | "reminder";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL: Notif[] = [
  { id: "n1", type: "streak", title: "Streak Milestone!", body: "You're on a 7-day streak. You're in the top 15% of users this week.", time: "2m ago", read: false },
  { id: "n2", type: "ai", title: "AI Coach Tip", body: "Based on your recent sessions, adding 10% more volume to pull days could accelerate your gains.", time: "18m ago", read: false },
  { id: "n3", type: "achievement", title: "Badge Unlocked 🏆", body: "You earned the 'Week Warrior' badge. 7 workouts in 7 days — respect.", time: "1h ago", read: false },
  { id: "n4", type: "reminder", title: "Workout Time", body: "You have 'Upper Push' scheduled for today. Tap to start your session.", time: "2h ago", read: true },
  { id: "n5", type: "social", title: "Sarah L. reacted 🔥", body: "Sarah liked your 5K run post. Keep inspiring the community.", time: "3h ago", read: true },
  { id: "n6", type: "workout", title: "Workout Complete", body: "Great session! You burned 340 cal and earned +180 XP. Recovery window is now.", time: "5h ago", read: true },
  { id: "n7", type: "ai", title: "Recovery Insight", body: "You've trained 4 days straight. Consider a mobility or rest day tomorrow for peak performance.", time: "1d ago", read: true },
  { id: "n8", type: "streak", title: "Streak at Risk!", body: "Don't break your 6-day streak — you have until midnight to log a session.", time: "1d ago", read: true },
  { id: "n9", type: "achievement", title: "Level Up!", body: "You reached Level 5. New challenges and workouts are now unlocked.", time: "2d ago", read: true },
  { id: "n10", type: "social", title: "Marcus K. challenged you", body: "Marcus challenged you to a 7-day calorie burn battle. Accept or ignore.", time: "2d ago", read: true },
];

const TYPE_META: Record<NotifType, { icon: string; color: string; bg: string }> = {
  streak:      { icon: "flame",              color: "#F3D27A", bg: "#F3D27A18" },
  achievement: { icon: "trophy",             color: "#A78BFA", bg: "#A78BFA18" },
  workout:     { icon: "checkmark-circle",   color: "#7BE0B8", bg: "#7BE0B818" },
  ai:          { icon: "sparkles",           color: "#8FB8FF", bg: "#8FB8FF18" },
  social:      { icon: "people",             color: "#FF2D78", bg: "#FF2D7818" },
  reminder:    { icon: "alarm",              color: "#F3D27A", bg: "#F3D27A18" },
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[]>(INITIAL);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const clearAll = () => setNotifs([]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.unreadText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllRead} style={styles.markBtn} activeOpacity={0.7}>
          <Text style={[styles.markBtnText, { color: colors.primary }]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {notifs.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All clear</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>No notifications right now. Keep grinding.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {unreadCount > 0 && (
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>New</Text>
          )}

          {notifs.map((notif, idx) => {
            const showDivider = idx > 0 && !notifs[idx - 1].read && notif.read;
            const meta = TYPE_META[notif.type];
            return (
              <React.Fragment key={notif.id}>
                {showDivider && (
                  <Text style={[styles.groupLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Earlier</Text>
                )}
                <TouchableOpacity
                  onPress={() => markRead(notif.id)}
                  activeOpacity={0.8}
                  style={[
                    styles.card,
                    {
                      backgroundColor: notif.read ? colors.card : colors.card,
                      borderColor: notif.read ? colors.border : colors.primary + "30",
                    },
                  ]}
                >
                  {!notif.read && (
                    <LinearGradient
                      colors={[colors.primary + "08", "transparent"]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                  <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{notif.title}</Text>
                      {!notif.read && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <Text style={[styles.cardText, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {notif.body}
                    </Text>
                    <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>{notif.time}</Text>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}

          <TouchableOpacity onPress={clearAll} style={[styles.clearBtn, { borderColor: colors.border }]} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.clearText, { color: colors.mutedForeground }]}>Clear all notifications</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  unreadBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  unreadText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  markBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  markBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  groupLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4, marginLeft: 4 },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "flex-start",
  },
  iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, gap: 3 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  cardText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  cardTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  clearBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, borderWidth: 1, paddingVertical: 12, marginTop: 8 },
  clearText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40 },
});
