import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, Platform,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useColors } from '@/hooks/useColors';
import { useFitness } from '@/contexts/FitnessContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export type VoiceStyle = 'coach' | 'energetic' | 'calm' | 'deep';

interface VoiceConfig {
  label: string;
  icon: string;
  description: string;
  pitch: number;
  rate: number;
}

const VOICE_STYLES: Record<VoiceStyle, VoiceConfig> = {
  coach:     { label: 'Coach',     icon: 'fitness',        description: 'Balanced & motivating',  pitch: 1.0,  rate: 0.95 },
  energetic: { label: 'Energetic', icon: 'flash',          description: 'Fast & high-energy',     pitch: 1.25, rate: 1.2  },
  calm:      { label: 'Calm',      icon: 'leaf',           description: 'Slow & focused',          pitch: 0.85, rate: 0.8  },
  deep:      { label: 'Deep',      icon: 'mic',            description: 'Low & powerful',          pitch: 0.65, rate: 0.85 },
};

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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('coach');
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const flatRef = useRef<FlatList>(null);

  const speak = useCallback(async (text: string, msgId: string) => {
    if (Platform.OS === 'web') return;
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        Speech.stop();
        if (speakingId === msgId) { setSpeakingId(null); return; }
      }
      const cfg = VOICE_STYLES[voiceStyle];
      setSpeakingId(msgId);
      Speech.speak(text, {
        pitch: cfg.pitch,
        rate: cfg.rate,
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
        onStopped: () => setSpeakingId(null),
      });
    } catch { setSpeakingId(null); }
  }, [voiceStyle, speakingId]);

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
      const replyId = (Date.now() + 1).toString();
      const reply: Message = { id: replyId, role: 'assistant', content: data.reply };
      setMessages((prev) => [reply, ...prev]);
      if (voiceEnabled && Platform.OS !== 'web') {
        setTimeout(() => speak(data.reply, replyId), 300);
      }
    } catch {
      const fallbackId = (Date.now() + 1).toString();
      const fallback = "Stay focused. Every rep, every set counts. What else can I help with?";
      setMessages((prev) => [{ id: fallbackId, role: 'assistant', content: fallback }, ...prev]);
      if (voiceEnabled && Platform.OS !== 'web') {
        setTimeout(() => speak(fallback, fallbackId), 300);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') Speech.stop();
    setSpeakingId(null);
    onClose();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const isSpeaking = speakingId === item.id;
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="fitness" size={14} color={colors.primary} />
          </View>
        )}
        <TouchableOpacity
          activeOpacity={isUser ? 1 : 0.75}
          onLongPress={!isUser ? () => speak(item.content, item.id) : undefined}
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
              : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
          ]}
        >
          <Text style={[styles.msgText, { color: isUser ? '#0D0D0D' : colors.foreground }]}>
            {item.content}
          </Text>
          {!isUser && Platform.OS !== 'web' && (
            <TouchableOpacity
              onPress={() => speak(item.content, item.id)}
              style={styles.speakBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                size={13}
                color={isSpeaking ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const currentVoice = VOICE_STYLES[voiceStyle];

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <LinearGradient colors={['#8FB8FF30', '#8FB8FF10']} style={styles.aiIcon}>
                <Ionicons name="fitness" size={22} color={colors.primary} />
              </LinearGradient>
              <View>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Coach</Text>
                <Text style={[styles.headerSub, { color: colors.success }]}>
                  {loading ? 'Thinking...' : 'Online'}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Voice toggle */}
              {Platform.OS !== 'web' && (
                <TouchableOpacity
                  onPress={() => setVoiceEnabled(!voiceEnabled)}
                  style={[styles.headerBtn, { backgroundColor: voiceEnabled ? colors.primary + '20' : colors.muted }]}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={voiceEnabled ? 'volume-high' : 'volume-mute'}
                    size={16}
                    color={voiceEnabled ? colors.primary : colors.mutedForeground}
                  />
                </TouchableOpacity>
              )}

              {/* Voice picker trigger */}
              {Platform.OS !== 'web' && (
                <TouchableOpacity
                  onPress={() => setShowVoicePicker(true)}
                  style={[styles.headerBtn, { backgroundColor: colors.muted }]}
                  activeOpacity={0.75}
                >
                  <Ionicons name={currentVoice.icon as any} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.muted }]}>
                <Ionicons name="close" size={18} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Active voice indicator */}
          {Platform.OS !== 'web' && voiceEnabled && (
            <TouchableOpacity
              onPress={() => setShowVoicePicker(true)}
              style={[styles.voiceBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Ionicons name={currentVoice.icon as any} size={13} color={colors.primary} />
              <Text style={[styles.voiceBannerText, { color: colors.primary }]}>
                {currentVoice.label} voice
              </Text>
              <Text style={[styles.voiceBannerDesc, { color: colors.mutedForeground }]}>
                · {currentVoice.description}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.mutedForeground} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

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
                <TouchableOpacity
                  key={q}
                  onPress={() => send(q)}
                  style={[styles.quickChip, { backgroundColor: colors.muted, borderColor: colors.border }]}
                >
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
                onSubmitEditing={() => send()}
                returnKeyType="send"
              />
              <TouchableOpacity
                onPress={() => send()}
                disabled={!input.trim() || loading}
                style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.muted }]}
              >
                {loading
                  ? <ActivityIndicator size="small" color={colors.mutedForeground} />
                  : <Ionicons name="send" size={16} color={input.trim() ? '#0D0D0D' : colors.mutedForeground} />
                }
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Voice Picker Modal */}
      <Modal
        visible={showVoicePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVoicePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={() => setShowVoicePicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.pickerSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.pickerHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.pickerTitle, { color: colors.foreground }]}>AI Voice Style</Text>
            <Text style={[styles.pickerSub, { color: colors.mutedForeground }]}>
              Choose how your coach sounds
            </Text>

            <View style={styles.voiceGrid}>
              {(Object.entries(VOICE_STYLES) as [VoiceStyle, VoiceConfig][]).map(([key, cfg]) => {
                const active = voiceStyle === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      setVoiceStyle(key);
                      if (Platform.OS !== 'web') {
                        Speech.stop();
                        setTimeout(() => Speech.speak(`${cfg.label} voice selected.`, { pitch: cfg.pitch, rate: cfg.rate }), 100);
                      }
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.voiceOption,
                      {
                        backgroundColor: active ? colors.primary + '15' : colors.background,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={active ? [colors.primary + '25', colors.primary + '08'] : ['transparent', 'transparent']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <View style={[styles.voiceOptionIcon, { backgroundColor: active ? colors.primary + '25' : colors.muted }]}>
                      <Ionicons name={cfg.icon as any} size={22} color={active ? colors.primary : colors.mutedForeground} />
                    </View>
                    <Text style={[styles.voiceOptionLabel, { color: active ? colors.primary : colors.foreground }]}>
                      {cfg.label}
                    </Text>
                    <Text style={[styles.voiceOptionDesc, { color: colors.mutedForeground }]}>
                      {cfg.description}
                    </Text>
                    {active && (
                      <View style={[styles.activeCheck, { backgroundColor: colors.primary }]}>
                        <Ionicons name="checkmark" size={10} color="#0D0D0D" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setShowVoicePicker(false)}
              style={[styles.pickerDone, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Text style={styles.pickerDoneText}>Done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  headerBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  voiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  voiceBannerText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  voiceBannerDesc: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  messageList: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  msgRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  avatar: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8, borderRadius: 16, gap: 4 },
  msgText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  speakBtn: { alignSelf: 'flex-end', marginTop: 2 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  typingText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  quickChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, maxWidth: 160 },
  quickText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 10, gap: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 14, fontFamily: 'Inter_400Regular', maxHeight: 90 },
  sendBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },

  /* Voice picker */
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, borderWidth: 1, borderBottomWidth: 0, gap: 8 },
  pickerHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  pickerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  pickerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 12 },
  voiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  voiceOption: {
    width: '47%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  voiceOptionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  voiceOptionLabel: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  voiceOptionDesc: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  activeCheck: { position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pickerDone: { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  pickerDoneText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0D0D0D' },
});
