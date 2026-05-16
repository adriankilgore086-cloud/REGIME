import React, { useMemo, useRef } from "react";
import { Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View, Image, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { AppFlashList } from "@/components/AppFlashList";
import type { SocialPost } from "@/contexts/SocialContext";

type UserIdentity = {
  userId: string;
  name: string;
  avatar: string;
  badge: string;
  profileImage?: string;
};

type Props = {
  visible: boolean;
  user: UserIdentity | null;
  posts: SocialPost[];
  onClose: () => void;
};

export default function UserProfileModal({ visible, user, posts, onClose }: Props) {
  const colors = useColors();
  const screenHeight = Dimensions.get("window").height;
  const panY = useRef(0);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8 && Math.abs(gesture.dx) < 18,
        onPanResponderMove: (_, gesture) => {
          panY.current = gesture.dy;
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 120) onClose();
          panY.current = 0;
        },
      }),
    [onClose]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background, height: screenHeight * 0.88 }]} {...panResponder.panHandlers}>
        <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
        {user && (
          <>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={[styles.avatarWrap, { backgroundColor: colors.primary + "22" }]}>
                {user.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{user.avatar}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.foreground }]}>{user.name}</Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>{user.badge}</Text>
                <Text style={[styles.sub, { color: colors.mutedForeground }]}>{posts.length} posts</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="close" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <AppFlashList
              data={posts}
              keyExtractor={(item) => item.id}
              estimatedItemSize={108}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              renderItem={({ item }) => (
                <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {!!item.text && <Text style={[styles.postText, { color: colors.foreground }]}>{item.text}</Text>}
                  {!!item.mediaUri && <Image source={{ uri: item.mediaUri }} style={styles.postImage} resizeMode="cover" />}
                  <Text style={[styles.postMeta, { color: colors.mutedForeground }]}>
                    {(item.comments?.length ?? 0)} comments · {(item.reactions?.fire?.length ?? 0) + (item.reactions?.flex?.length ?? 0) + (item.reactions?.clap?.length ?? 0)} reactions
                  </Text>
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#00000066" },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  dragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  avatarWrap: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: 52, height: 52, borderRadius: 16 },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  name: { fontSize: 18, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  closeBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  postCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
  postText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  postImage: { width: "100%", height: 180, borderRadius: 12 },
  postMeta: { fontSize: 11, fontFamily: "Inter_500Medium" },
});

