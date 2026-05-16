import React, { useMemo, useState, useCallback, memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFitness } from "@/contexts/FitnessContext";
import { Audience, SocialComment, SocialPost, useSocial } from "@/contexts/SocialContext";
import CreatePostModal from "@features/social/components/CreatePostModal";
import UserProfileModal from "@features/social/components/UserProfileModal";
import { AppFlashList } from "@/components/AppFlashList";

type ProfileMini = { userId: string; name: string; avatar: string; badge: string; profileImage?: string };

type FeedCardProps = {
  post: SocialPost;
  myUserId: string;
  toggleReaction: (postId: string, reaction: "fire" | "flex" | "clap", userId: string) => void;
  addComment: (postId: string, comment: Omit<SocialComment, "id" | "createdAt">) => void;
  commentMeta: { userName: string; userAvatar: string; userBadge: string; userProfileImage?: string };
  onViewProfile: (u: ProfileMini) => void;
};

const FeedCard = memo(function FeedCard({
  post,
  myUserId,
  toggleReaction,
  addComment,
  commentMeta,
  onViewProfile,
}: FeedCardProps) {
  const colors = useColors();
  const [comment, setComment] = useState("");

  const firePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleReaction(post.id, "fire", myUserId);
  }, [toggleReaction, post.id, myUserId]);

  const flexPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleReaction(post.id, "flex", myUserId);
  }, [toggleReaction, post.id, myUserId]);

  const clapPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleReaction(post.id, "clap", myUserId);
  }, [toggleReaction, post.id, myUserId]);

  const profilePress = useCallback(() => {
    onViewProfile({
      userId: post.userId,
      name: post.userName,
      avatar: post.userAvatar,
      badge: post.userBadge,
      profileImage: post.userProfileImage,
    });
  }, [onViewProfile, post]);

  const sendComment = useCallback(() => {
    const t = comment.trim();
    if (!t) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addComment(post.id, {
      userId: myUserId,
      userName: commentMeta.userName,
      userAvatar: commentMeta.userAvatar,
      userProfileImage: commentMeta.userProfileImage,
      userBadge: commentMeta.userBadge,
      text: t,
    });
    setComment("");
  }, [comment, addComment, post.id, commentMeta, myUserId]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity onPress={profilePress} style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
          {post.userProfileImage ? (
            <Image source={{ uri: post.userProfileImage }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarText, { color: colors.primary }]}>{post.userAvatar}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.foreground }]}>{post.userName}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{post.userBadge}</Text>
        </View>
      </TouchableOpacity>

      {!!post.text && <Text style={[styles.bodyText, { color: colors.foreground }]}>{post.text}</Text>}
      {!!post.mediaUri && <Image source={{ uri: post.mediaUri }} style={styles.postImg} resizeMode="cover" />}

      <View style={styles.reactionRow}>
        <TouchableOpacity onPress={firePress}>
          <Text style={[styles.reaction, { color: colors.mutedForeground }]}>🔥 {post.reactions.fire.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={flexPress}>
          <Text style={[styles.reaction, { color: colors.mutedForeground }]}>💪 {post.reactions.flex.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clapPress}>
          <Text style={[styles.reaction, { color: colors.mutedForeground }]}>👏 {post.reactions.clap.length}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.commentRow}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Add a comment..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.commentInput, { backgroundColor: colors.muted, color: colors.foreground }]}
        />
        <TouchableOpacity onPress={sendComment} style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="send" size={12} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function FeedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userProfile, rank } = useFitness();
  const { posts, addComment, toggleReaction } = useSocial();
  const [audience, setAudience] = useState<Audience>("global");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileMini | null>(null);
  const myUserId = "me";
  const myAvatar = userProfile.name.charAt(0).toUpperCase() || "?";

  const commentMeta = useMemo(
    () => ({
      userName: userProfile.name,
      userAvatar: myAvatar,
      userBadge: rank,
      userProfileImage: userProfile.profileImage ?? undefined,
    }),
    [userProfile.name, userProfile.profileImage, myAvatar, rank]
  );

  const filteredPosts = useMemo(
    () => posts.filter((p) => (audience === "global" ? true : p.audience === "friends" || p.userId === myUserId)),
    [audience, posts]
  );
  const selectedUserPosts = useMemo(() => (selectedUser ? posts.filter((p) => p.userId === selectedUser.userId) : []), [posts, selectedUser]);

  const renderItem = useCallback(
    ({ item }: { item: SocialPost }) => (
      <FeedCard
        post={item}
        myUserId={myUserId}
        toggleReaction={toggleReaction}
        addComment={addComment}
        commentMeta={commentMeta}
        onViewProfile={setSelectedUser}
      />
    ),
    [toggleReaction, addComment, commentMeta]
  );

  const keyExtractor = useCallback((item: SocialPost) => item.id, []);

  const openCreatePost = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCreatePost(true);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Feed</Text>
        <TouchableOpacity onPress={openCreatePost} style={[styles.createBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={16} color={colors.primaryForeground} />
          <Text style={[styles.createText, { color: colors.primaryForeground }]}>Post</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.filterRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {(["global", "friends"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => {
              void Haptics.selectionAsync();
              setAudience(f);
            }}
            style={[styles.filterBtn, audience === f && { backgroundColor: colors.card }]}
          >
            <Text style={{ color: audience === f ? colors.foreground : colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
              {f === "global" ? "Global Feed" : "Friends Only"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <AppFlashList
        data={filteredPosts}
        keyExtractor={keyExtractor}
        estimatedItemSize={220}
        removeClippedSubviews={Platform.OS === "android"}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
      />

      <CreatePostModal visible={showCreatePost} onClose={() => setShowCreatePost(false)} />
      <UserProfileModal visible={!!selectedUser} user={selectedUser} posts={selectedUserPosts} onClose={() => setSelectedUser(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  backBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 24, fontFamily: "Poppins_700Bold" },
  createBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  createText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  filterRow: { flexDirection: "row", borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 3 },
  filterBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 9 },
  card: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 10, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { width: 36, height: 36, borderRadius: 11 },
  avatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  name: { fontSize: 14, fontFamily: "Inter_700Bold" },
  meta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  bodyText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  postImg: { width: "100%", height: 180, borderRadius: 12 },
  reactionRow: { flexDirection: "row", gap: 14 },
  reaction: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  commentRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentInput: { flex: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontFamily: "Inter_400Regular" },
  sendBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
});
