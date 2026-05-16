import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Platform,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useColors } from '@shared/hooks/useColors';
import { ChatInputBar } from "@features/ai-coach/components/ChatInputBar";
import { ChatMessageList } from "@features/ai-coach/components/ChatMessageList";
import { useAICoach } from "@features/ai-coach/hooks/useAICoach";
import type { Message } from "@features/ai-coach/types";

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

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AIChatModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('coach');
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

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

  const handleReply = useCallback((message: Message) => {
    if (voiceEnabled && Platform.OS !== 'web') {
      setTimeout(() => speak(message.content, message.id), 300);
    }
  }, [speak, voiceEnabled]);

  const { messages, sendMessage, isLoading } = useAICoach({ onReply: handleReply });

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput('');
    await sendMessage(msg);
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') Speech.stop();
    setSpeakingId(null);
    onClose();
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
                  {isLoading ? 'Thinking...' : 'Online'}
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
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              speakingId={speakingId}
              colors={colors}
              onSpeak={speak}
            />

            <ChatInputBar
              value={input}
              isLoading={isLoading}
              bottomInset={insets.bottom}
              colors={colors}
              onChange={setInput}
              onSend={send}
            />
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
  input: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 14, fontFamily: 'Inter_400Regular', maxHeight: 90, backgroundColor: "transparent" },
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
