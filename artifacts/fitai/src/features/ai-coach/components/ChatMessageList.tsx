import React from "react";
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Message } from "@features/ai-coach/types";
import type { useColors } from "@shared/hooks/useColors";

type Props = {
  messages: Message[];
  isLoading: boolean;
  speakingId: string | null;
  colors: ReturnType<typeof useColors>;
  onSpeak: (content: string, id: string) => void;
};

export function ChatMessageList({ messages, isLoading, speakingId, colors, onSpeak }: Props) {
  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => {
        const isUser = item.role === "user";
        const isSpeaking = speakingId === item.id;

        return (
          <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
            {!isUser && (
              <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                <Ionicons name="fitness" size={14} color={colors.primary} />
              </View>
            )}
            <TouchableOpacity
              activeOpacity={isUser ? 1 : 0.75}
              onLongPress={!isUser ? () => onSpeak(item.content, item.id) : undefined}
              style={[
                styles.bubble,
                isUser
                  ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
              ]}
            >
              <Text style={[styles.msgText, { color: isUser ? "#0D0D0D" : colors.foreground }]}>{item.content}</Text>
              {!isUser && Platform.OS !== "web" && (
                <TouchableOpacity
                  onPress={() => onSpeak(item.content, item.id)}
                  style={styles.speakBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={isSpeaking ? "volume-high" : "volume-medium-outline"}
                    size={13}
                    color={isSpeaking ? colors.primary : colors.mutedForeground}
                  />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
        );
      }}
      keyExtractor={(message) => message.id}
      contentContainerStyle={styles.messageList}
      inverted
      initialNumToRender={12}
      maxToRenderPerBatch={8}
      windowSize={5}
      removeClippedSubviews={Platform.OS !== "web"}
      ListHeaderComponent={
        isLoading ? (
          <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.typingText, { color: colors.mutedForeground }]}>Coaching...</Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  messageList: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  msgRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  msgRowUser: { flexDirection: "row-reverse" },
  avatar: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  bubble: { maxWidth: "82%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, position: "relative" },
  msgText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  speakBtn: { position: "absolute", right: 8, bottom: -18 },
  typingBubble: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  typingText: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
