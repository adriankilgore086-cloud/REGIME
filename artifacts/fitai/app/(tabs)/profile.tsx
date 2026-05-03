import React, { useState, useRef, useMemo, memo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, Alert, Image, TextInput, KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { useSocial, SocialPost, Audience } from "@/contexts/SocialContext";
import { ACHIEVEMENTS, RARITY_COLORS } from "@/constants/achievements";
import { XPProgressBar } from "@/components/XPProgressBar";
import CreatePostModal from "@/components/CreatePostModal";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_META: Record<string, { color: string; icon: string; label: string }> = {
  text:      { color: "#8FB8FF", icon: "chatbubble",  label: "Post" },
  workout:   { color: "#7BE0B8", icon: "barbell",     label: "Workout" },
  milestone: { color: "#F3D27A", icon: "trophy",      label: "Milestone" },
  pr:        { color: "#FF2D78", icon: "flash",       label: "PR" },
  media:     { color: "#A78BFA", icon: "image",       label: "Photo" },
};

const IDENTITY_TITLES = [
  "The Grinder", "Elite Performer", "Iron Discipline", "Consistency King",
  "Endurance Champion", "Power Lifter", "Speed Demon", "Recovery Master",
];


const PostCard = memo(function PostCard({ post, myUserId, myName, myAvatar, myBadge }: {
  post: SocialPost;
  myUserId: string;
  myName: string;
  myAvatar: string;
  myBadge: string;
}) {
  const colors = useColors();
  const { toggleReaction, addComment, deletePost, addReply } = useSocial();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const meta = TYPE_META[post.type] ?? TYPE_META.text;
  const topLevelComments = post.comments.filter((c) => !c.parentId);
  const repliesByParent = post.comments.filter((c) => c.parentId);

  const fire = post.reactions.fire.includes(myUserId);
  const flex = post.reactions.flex.includes(myUserId);
  const clap = post.reactions.clap.includes(myUserId);

  const submitComment = () => {
    const t = commentText.trim();
    if (!t) return;
    addComment(post.id, { userId: myUserId, userName: myName, userAvatar: myAvatar, userBadge: myBadge, text: t });
    setCommentText("");
  };

  const submitReply = () => {
    const t = replyText.trim();
    if (!t || !replyTo) return;
    addReply(post.id, replyTo, { userId: myUserId, userName: myName, userAvatar: myAvatar, userBadge: myBadge, text: t });
    setReplyText("");
    setReplyTo(null);
  };

  const isImagePost = post.type === "media" && !!post.mediaUri;
  const isTextOnly = !post.mediaUri && !post.workoutName && !post.milestoneTitle && !post.value && post.text.trim().length > 0 && post.type === "text";

  return (
    <View style={[pcStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={pcStyles.header}>
        <View style={[pcStyles.avatar, { backgroundColor: meta.color + "25", borderColor: meta.color + "45" }]}>
          <Text style={[pcStyles.avatarText, { color: meta.color }]}>{post.userAvatar}</Text>
        </View>
        <View style={pcStyles.meta}>
          <Text style={[pcStyles.userName, { color: colors.foreground }]}>{post.userName}</Text>
          <Text style={[pcStyles.userBadge, { color: colors.mutedForeground }]}>{post.userBadge} · {timeAgo(post.createdAt)}</Text>
        </View>
        <View style={pcStyles.headerRight}>
          <View style={[pcStyles.typeChip, { backgroundColor: meta.color + "20", borderColor: meta.color + "40" }]}>
            <Ionicons name={meta.icon as any} size={10} color={meta.color} />
            <Text style={[pcStyles.typeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <View style={[pcStyles.audienceChip, { backgroundColor: post.audience === "global" ? "#8FB8FF15" : "#A78BFA15" }]}>
            <Ionicons name={post.audience === "global" ? "globe-outline" : "people-outline"} size={10} color={post.audience === "global" ? "#8FB8FF" : "#A78BFA"} />
          </View>
          {post.userId === myUserId && (
            <TouchableOpacity onPress={() => Alert.alert("Delete post?", "", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => deletePost(post.id, myUserId) },
            ])}>
              <Ionicons name="trash-outline" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {post.text.length > 0 && (
        <View style={[pcStyles.textBox, isTextOnly && { minHeight: 88 }, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Text style={[pcStyles.text, { color: colors.foreground }]}>{post.text}</Text>
        </View>
      )}

      {post.mediaUri && (
        <View style={[pcStyles.mediaWrap, { borderColor: colors.border }]}>
          <Image source={{ uri: post.mediaUri }} style={pcStyles.media} resizeMode="cover" />
        </View>
      )}

      {post.type === "workout" && post.workoutName && (
        <View style={[pcStyles.workoutCard, { backgroundColor: "#7BE0B810", borderColor: "#7BE0B830" }]}>
          <Ionicons name="barbell" size={14} color="#7BE0B8" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#7BE0B8", fontSize: 13, fontFamily: "Inter_700Bold" }}>{post.workoutName}</Text>
            {(post.workoutDuration || post.workoutCalories) && (
              <Text style={{ color: "#7BE0B880", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 }}>
                {[post.workoutDuration, post.workoutCalories && `${post.workoutCalories} kcal`].filter(Boolean).join(" · ")}
              </Text>
            )}
          </View>
          <Ionicons name="checkmark-circle" size={18} color="#7BE0B8" />
        </View>
      )}

      {post.type === "milestone" && post.milestoneTitle && (
        <View style={[pcStyles.workoutCard, { backgroundColor: "#F3D27A10", borderColor: "#F3D27A30" }]}>
          <Ionicons name="trophy" size={14} color="#F3D27A" />
          <Text style={{ color: "#F3D27A", fontSize: 13, fontFamily: "Inter_700Bold", flex: 1 }}>{post.milestoneTitle}</Text>
          <Text style={{ fontSize: 18 }}>🏆</Text>
        </View>
      )}

      {post.value && (
        <View style={[pcStyles.valueChip, { backgroundColor: meta.color + "18", borderColor: meta.color + "35" }]}>
          <Text style={[pcStyles.valueText, { color: meta.color }]}>{post.value}</Text>
        </View>
      )}

      <View style={pcStyles.actions}>
        <TouchableOpacity onPress={() => toggleReaction(post.id, "fire", myUserId)} style={[pcStyles.reactionBtn, fire && { backgroundColor: "#FF2D7820" }]}>
          <Text style={pcStyles.reactionEmoji}>🔥</Text>
          <Text style={[pcStyles.reactionCount, { color: fire ? "#FF2D78" : colors.mutedForeground }]}>{post.reactions.fire.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleReaction(post.id, "flex", myUserId)} style={[pcStyles.reactionBtn, flex && { backgroundColor: "#7BE0B820" }]}>
          <Text style={pcStyles.reactionEmoji}>💪</Text>
          <Text style={[pcStyles.reactionCount, { color: flex ? "#7BE0B8" : colors.mutedForeground }]}>{post.reactions.flex.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleReaction(post.id, "clap", myUserId)} style={[pcStyles.reactionBtn, clap && { backgroundColor: "#8FB8FF20" }]}>
          <Text style={pcStyles.reactionEmoji}>👏</Text>
          <Text style={[pcStyles.reactionCount, { color: clap ? "#8FB8FF" : colors.mutedForeground }]}>{post.reactions.clap.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowComments(!showComments)} style={[pcStyles.reactionBtn, showComments && { backgroundColor: "#A78BFA15" }]}>
          <Ionicons name="chatbubble-outline" size={13} color={showComments ? "#A78BFA" : colors.mutedForeground} />
          <Text style={[pcStyles.reactionCount, { color: showComments ? "#A78BFA" : colors.mutedForeground }]}>{post.comments.length} Reply{post.comments.length === 1 ? "" : "ies"}</Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={[pcStyles.commentsSection, { borderTopColor: colors.border }]}>
          {topLevelComments.map((c) => {
            const replyCount = repliesByParent.filter((r) => r.parentId === c.id).length;
            return (
              <View key={c.id}>
                <View style={pcStyles.commentRow}>
                  <View style={[pcStyles.commentAvatar, { backgroundColor: colors.muted }]}>
                    <Text style={[pcStyles.commentAvatarText, { color: colors.mutedForeground }]}>{c.userAvatar}</Text>
                  </View>
                  <View style={[pcStyles.commentBubble, { backgroundColor: colors.muted }]}>
                    <Text style={[pcStyles.commentUser, { color: colors.foreground }]}>{c.userName}</Text>
                    <Text style={[pcStyles.commentText, { color: colors.foreground }]}>{c.text}</Text>
                    <Text style={[pcStyles.commentTime, { color: colors.mutedForeground }]}>{timeAgo(c.createdAt)}</Text>
                  </View>
                </View>
                <View style={pcStyles.commentActionsRow}>
                  <TouchableOpacity onPress={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyText(""); }} style={pcStyles.replyBtn}>
                    <Text style={[pcStyles.replyText, { color: colors.mutedForeground }]}>Reply</Text>
                  </TouchableOpacity>
                  <Text style={[pcStyles.replyCountText, { color: colors.mutedForeground }]}>
                    {replyCount} repl{replyCount === 1 ? "y" : "ies"}
                  </Text>
                </View>
                {replyTo === c.id && (
                  <View style={pcStyles.replyComposer}>
                    <TextInput
                      style={[pcStyles.commentInput, { backgroundColor: colors.muted, color: colors.foreground }]}
                      placeholder="Write a reply..."
                      placeholderTextColor={colors.mutedForeground}
                      value={replyText}
                      onChangeText={setReplyText}
                      returnKeyType="send"
                      onSubmitEditing={submitReply}
                    />
                    <TouchableOpacity onPress={submitReply} disabled={!replyText.trim()} style={[pcStyles.sendBtn, { backgroundColor: replyText.trim() ? colors.primary : colors.muted }]}>
                      <Ionicons name="send" size={12} color={replyText.trim() ? "#0D0D0D" : colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                )}
                {repliesByParent.filter((r) => r.parentId === c.id).map((r) => (
                  <View key={r.id} style={pcStyles.replyRow}>
                    <View style={[pcStyles.commentAvatar, { backgroundColor: colors.card }]}>
                      <Text style={[pcStyles.commentAvatarText, { color: colors.mutedForeground }]}>{r.userAvatar}</Text>
                    </View>
                    <View style={[pcStyles.replyBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[pcStyles.commentUser, { color: colors.foreground }]}>{r.userName}</Text>
                      <Text style={[pcStyles.commentText, { color: colors.foreground }]}>{r.text}</Text>
                      <Text style={[pcStyles.commentTime, { color: colors.mutedForeground }]}>{timeAgo(r.createdAt)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
          <View style={[pcStyles.commentInputRow, { borderTopColor: colors.border }]}>
            <View style={[pcStyles.commentInputAvatar, { backgroundColor: colors.primary + "25" }]}>
              <Text style={[pcStyles.commentAvatarText, { color: colors.primary }]}>{myAvatar}</Text>
            </View>
            <TextInput
              style={[pcStyles.commentInput, { backgroundColor: colors.muted, color: colors.foreground }]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.mutedForeground}
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={submitComment}
              returnKeyType="send"
              maxLength={200}
            />
            <TouchableOpacity onPress={submitComment} disabled={!commentText.trim()} style={[pcStyles.sendBtn, { backgroundColor: commentText.trim() ? colors.primary : colors.muted }]}>
              <Ionicons name="send" size={12} color={commentText.trim() ? "#0D0D0D" : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

const pcStyles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  avatarText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  meta: { flex: 1 },
  userName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  userBadge: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  typeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  audienceChip: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  textBox: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  text: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  mediaWrap: { width: "100%", aspectRatio: 1, borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 10 },
  media: { width: "100%", height: "100%" },
  workoutCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  valueChip: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  valueText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  actions: { flexDirection: "row", gap: 4 },
  reactionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: "#FFFFFF08" },
  reactionEmoji: { fontSize: 13 },
  reactionCount: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  commentsSection: { marginTop: 12, borderTopWidth: 1, paddingTop: 12, gap: 10 },
  commentRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  commentActionsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginLeft: 36, marginTop: -4 },
  replyBtn: { paddingVertical: 2 },
  replyText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  replyCountText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  commentAvatar: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  commentInputAvatar: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  commentAvatarText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  commentBubble: { flex: 1, borderRadius: 12, padding: 10, gap: 2 },
  replyRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginLeft: 36 },
  replyBubble: { flex: 1, borderRadius: 12, padding: 10, gap: 2, borderWidth: 1 },
  replyComposer: { flexDirection: "row", gap: 8, alignItems: "center", marginLeft: 36 },
  commentUser: { fontSize: 12, fontFamily: "Inter_700Bold" },
  commentText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  commentTime: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  commentInputRow: { flexDirection: "row", gap: 8, alignItems: "center", borderTopWidth: 1, paddingTop: 10, marginTop: 2 },
  commentInput: { flex: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontFamily: "Inter_400Regular" },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});

const TABS = ["Overview", "Social", "Leaderboard"] as const;
type Tab = typeof TABS[number];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { userProfile, userStats, level, rank, xpProgress, earnedAchievements, updateProfile } = useFitness();
  const { posts } = useSocial();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [feedFilter, setFeedFilter] = useState<Audience>("global");
  const [showCreatePost, setShowCreatePost] = useState(false);

  const myUserId = "me";
  const myAvatar = userProfile.name.charAt(0).toUpperCase();
  const filteredPosts = useMemo(
    () => posts.filter((p) => feedFilter === "global" ? true : p.audience === "friends" || p.userId === myUserId),
    [posts, feedFilter, myUserId]
  );

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const handleSelectProfileImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await updateProfile({ profileImage: imageUri });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image");
    }
  };

  const earnedSet = useMemo(() => new Set(earnedAchievements.map((a) => a.id)), [earnedAchievements]);
  const earnedBadges = useMemo(() => ACHIEVEMENTS.filter((a) => earnedSet.has(a.id)), [earnedSet]);
  const lockedBadges = useMemo(() => ACHIEVEMENTS.filter((a) => !earnedSet.has(a.id)).slice(0, 4), [earnedSet]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topSection, { paddingTop: topPad + 12 }]}>
        <LinearGradient colors={["#8FB8FF15", "#A78BFA10", "transparent"]} style={StyleSheet.absoluteFill} />

        <View style={styles.profileRow}>
          <TouchableOpacity onPress={handleSelectProfileImage}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary + "20", borderColor: colors.primary + "50" }]}>
              {userProfile.profileImage ? (
                <Image source={{ uri: userProfile.profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: colors.primary }]}>{userProfile.name.charAt(0).toUpperCase()}</Text>
              )}
              <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={12} color="#0D0D0D" />
              </View>
            </View>
          </TouchableOpacity>
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

            <View style={styles.feedControls}>
              <View style={[styles.feedFilterRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                {(["global", "friends"] as const).map((f) => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFeedFilter(f)}
                    style={[styles.feedFilterBtn, feedFilter === f && { backgroundColor: colors.card }]}
                  >
                    <Ionicons name={f === "global" ? "globe-outline" : "people-outline"} size={12} color={feedFilter === f ? colors.foreground : colors.mutedForeground} />
                    <Text style={[styles.feedFilterText, { color: feedFilter === f ? colors.foreground : colors.mutedForeground }]}>
                      {f === "global" ? "Everyone" : "Friends"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => setShowCreatePost(true)}
                style={[styles.createPostBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={16} color="#0D0D0D" />
                <Text style={styles.createPostText}>Post</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowCreatePost(true)}
              style={[styles.composeBar, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <View style={[styles.composeAvatar, { backgroundColor: colors.primary + "25", borderColor: colors.primary + "40" }]}>
                <Text style={[styles.composeAvatarText, { color: colors.primary }]}>{myAvatar}</Text>
              </View>
              <View style={[styles.composePlaceholder, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.composePlaceholderText, { color: colors.mutedForeground }]}>Share a workout, milestone, or PR...</Text>
              </View>
              <View style={styles.composeActions}>
                <Ionicons name="image-outline" size={18} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>

            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                myUserId={myUserId}
                myName={userProfile.name}
                myAvatar={myAvatar}
                myBadge={rank}
              />
            ))}

            {filteredPosts.length === 0 && (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="people-outline" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No friend posts yet — be the first to share!</Text>
              </View>
            )}
          </>
        )}

        {activeTab === "Leaderboard" && (
          <>
            <TouchableOpacity
              onPress={() => router.push("/leaderboard" as any)}
              activeOpacity={0.85}
              style={[styles.lbHeroCard, { backgroundColor: colors.card, borderColor: "#F3D27A35" }]}
            >
              <LinearGradient
                colors={["#F3D27A18", "#A78BFA10", "transparent"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />
              <View style={styles.lbHeroTop}>
                <View style={[styles.lbTrophyWrap, { backgroundColor: "#F3D27A20" }]}>
                  <Ionicons name="trophy" size={28} color="#F3D27A" />
                </View>
                <View style={styles.lbHeroText}>
                  <Text style={[styles.lbHeroTitle, { color: colors.foreground }]}>Global Leaderboard</Text>
                  <Text style={[styles.lbHeroSub, { color: colors.mutedForeground }]}>
                    See where you stand against the community
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
              </View>
              <View style={[styles.lbHeroDivider, { backgroundColor: "#F3D27A20" }]} />
              <View style={styles.lbHeroStats}>
                {[
                  { label: "Your XP", value: userStats.xp.toLocaleString(), color: "#F3D27A" },
                  { label: "Streak", value: `${userStats.streak}d`, color: "#FF2D78" },
                  { label: "Level", value: `${level}`, color: "#A78BFA" },
                ].map((s) => (
                  <View key={s.label} style={styles.lbHeroStat}>
                    <Text style={[styles.lbHeroStatVal, { color: s.color }]}>{s.value}</Text>
                    <Text style={[styles.lbHeroStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>

            <View style={[styles.lbPreviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.lbPreviewTitle, { color: colors.mutedForeground }]}>THIS WEEK'S TOP 3</Text>
              {[
                { name: "Marcus Cole", xp: "9,400 XP", medal: "🥇" },
                { name: "Ayasha Ren", xp: "8,800 XP", medal: "🥈" },
                { name: "Leo Hartmann", xp: "7,200 XP", medal: "🥉" },
              ].map((row) => (
                <View key={row.name} style={[styles.lbPreviewRow, { borderBottomColor: colors.border }]}>
                  <Text style={styles.lbMedal}>{row.medal}</Text>
                  <Text style={[styles.lbPreviewName, { color: colors.foreground }]}>{row.name}</Text>
                  <Text style={[styles.lbPreviewXP, { color: "#F3D27A" }]}>{row.xp}</Text>
                </View>
              ))}
              <TouchableOpacity
                onPress={() => router.push("/leaderboard" as any)}
                style={[styles.lbViewAll, { backgroundColor: "#F3D27A18", borderColor: "#F3D27A35" }]}
              >
                <Text style={[styles.lbViewAllText, { color: "#F3D27A" }]}>View Full Rankings</Text>
                <Ionicons name="arrow-forward" size={14} color="#F3D27A" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <CreatePostModal visible={showCreatePost} onClose={() => setShowCreatePost(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topSection: { paddingHorizontal: 20, paddingBottom: 0, overflow: "hidden" },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  avatarCircle: { width: 78, height: 78, borderRadius: 26, alignItems: "center", justifyContent: "center", borderWidth: 2, position: "relative" },
  avatarImage: { width: 78, height: 78, borderRadius: 24 },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold" },
  editBadge: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#0D0D0D" },
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
  feedHeader: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 10, overflow: "hidden" },
  feedHeaderText: { flex: 1, fontSize: 14, fontFamily: "Inter_700Bold" },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  feedControls: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  feedFilterRow: { flex: 1, flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 3 },
  feedFilterBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 7, borderRadius: 9 },
  feedFilterText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  createPostBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  createPostText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#0D0D0D" },
  composeBar: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 14 },
  composeAvatar: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  composeAvatarText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  composePlaceholder: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1 },
  composePlaceholderText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  composeActions: { flexDirection: "row", gap: 8 },
  lbHeroCard: { borderRadius: 22, borderWidth: 1, padding: 20, marginBottom: 14, overflow: "hidden" },
  lbHeroTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  lbTrophyWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  lbHeroText: { flex: 1 },
  lbHeroTitle: { fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  lbHeroSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  lbHeroDivider: { height: 1, marginBottom: 16 },
  lbHeroStats: { flexDirection: "row", justifyContent: "space-around" },
  lbHeroStat: { alignItems: "center", gap: 3 },
  lbHeroStatVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  lbHeroStatLabel: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  lbPreviewCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 14 },
  lbPreviewTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 14 },
  lbPreviewRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  lbMedal: { fontSize: 20, width: 28 },
  lbPreviewName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  lbPreviewXP: { fontSize: 13, fontFamily: "Inter_700Bold" },
  lbViewAll: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1 },
  lbViewAllText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
