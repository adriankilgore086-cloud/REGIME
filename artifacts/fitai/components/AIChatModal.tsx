import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useFitness } from '@/contexts/FitnessContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  "What should I train today?",
  "Create a 30-min leg workout",
  "How do I improve my bench?",
  "Tips to break a plateau",
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AIChatModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userStats, userProfile, level, rank } = useFitness();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hey! I'm your AI fitness coach. You're at Level ${level} with a ${userStats.streak}-day streak — impressive discipline. What can I help you with today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg };
    setMessages((prev) => [userMsg, ...prev]);
    setLoading(true);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : '';
      const res = await fetch(`${baseUrl}/api/ai/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          context: {
            level, rank,
            streak: userStats.streak,
            totalWorkouts: userStats.totalWorkouts,
            fitnessGoal: userProfile.fitnessGoal,
            caloriesBurned: userStats.caloriesBurned,
          },
        }),
      });
      const data = await res.json();
      const reply: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply };
      setMessages((prev) => [reply, ...prev]);
    } catch {
      setMessages((prev) => [{
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Stay focused. Every rep, every set counts. What else can I help with?",
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="fitness" size={14} color={colors.primary} />
          </View>
        )}
        <View style={[
          styles.bubble,
          isUser
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }
        ]}>
          <Text style={[styles.msgText, { color: isUser ? '#08081A' : colors.foreground }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={['#00D4FF30', '#00D4FF10']} style={styles.aiIcon}>
              <Ionicons name="fitness" size={22} color={colors.primary} />
            </LinearGradient>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Coach</Text>
              <Text style={[styles.headerSub, { color: colors.success }]}>Online</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
            <Ionicons name="close" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messageList}
            inverted
            ListHeaderComponent={loading ? (
              <View style={[styles.typingBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.typingText, { color: colors.mutedForeground }]}>Coaching...</Text>
              </View>
            ) : null}
          />

          <View style={styles.quickRow}>
            {QUICK_PROMPTS.map((q) => (
              <TouchableOpacity key={q} onPress={() => send(q)} style={[styles.quickChip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.quickText, { color: colors.mutedForeground }]} numberOfLines={1}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground }]}
              placeholder="Ask your coach..."
              placeholderTextColor={colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={300}
            />
            <TouchableOpacity
              onPress={() => send()}
              disabled={!input.trim() || loading}
              style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.muted }]}
            >
              <Ionicons name="send" size={16} color={input.trim() ? '#08081A' : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  closeBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  msgRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  msgText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  typingText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  quickChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, maxWidth: 160 },
  quickText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 10, gap: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 14, fontFamily: 'Inter_400Regular', maxHeight: 90 },
  sendBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});
