import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Modal, TouchableOpacity, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@shared/hooks/useColors';
import { RewardData } from '@store/FitnessContext';
import { RARITY_COLORS } from '@features/gamification/constants/achievements';

const { width, height } = Dimensions.get('window');
const NUM_PARTICLES = 18;

function Particle({ delay, color }: { delay: number; color: string }) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  const startX = useRef((Math.random() - 0.5) * width * 0.8).current;
  const startY = useRef(-Math.random() * height * 0.5).current;
  const endY = height * 0.2;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== "web" }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(x, { toValue: startX, duration: 1200, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(y, { toValue: endY, duration: 1200, useNativeDriver: Platform.OS !== "web" }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
  }, []);

  const size = useRef(5 + Math.random() * 9).current;

  return (
    <Animated.View style={{
      position: 'absolute', top: '40%', left: '50%',
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color,
      transform: [{ translateX: x }, { translateY: y }, { scale }],
      opacity,
    }} />
  );
}

interface Props {
  visible: boolean;
  data: RewardData | null;
  onDismiss: () => void;
}

export function RewardOverlay({ visible, data, onDismiss }: Props) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      opacity.setValue(0);
      xpAnim.setValue(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: Platform.OS !== "web", tension: 50, friction: 7 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(xpAnim, { toValue: 1, duration: 1000, delay: 300, useNativeDriver: false }),
      ]).start();
      const timer = setTimeout(onDismiss, 3500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!data) return null;

  const particleColors = ['#8FB8FF', '#7BE0B8', '#F3D27A', '#FF2D78', '#A78BFA'];
  const achievementColor = data.achievement ? RARITY_COLORS[data.achievement.rarity] : colors.primary;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
          <Particle key={i} delay={i * 40} color={particleColors[i % particleColors.length]} />
        ))}
        <Animated.View style={[styles.card, { borderColor: colors.border, shadowColor: achievementColor, transform: [{ scale }], opacity }]}>
          <LinearGradient colors={['#1E1E1E', '#161616']} style={styles.cardInner}>
            <View style={[styles.iconCircle, { backgroundColor: achievementColor + '18', borderColor: achievementColor + '60' }]}>
              <Ionicons
                name={data.achievement ? 'trophy' : 'checkmark-circle'}
                size={44}
                color={achievementColor}
              />
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>
              {data.achievement ? 'Achievement!' : 'Workout Complete!'}
            </Text>
            <Text style={[styles.message, { color: colors.mutedForeground }]}>{data.message}</Text>

            <View style={[styles.xpContainer, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="flash" size={18} color={colors.primary} />
              <Text style={[styles.xpText, { color: colors.primary }]}>+{data.xp} XP</Text>
            </View>

            <TouchableOpacity onPress={onDismiss} style={[styles.doneBtn, { backgroundColor: achievementColor }]}>
              <Text style={[styles.doneBtnText, { color: '#0D0D0D' }]}>Claim Reward</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center' },
  card: { width: width * 0.82, borderRadius: 28, overflow: 'hidden', borderWidth: 1, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 20 },
  cardInner: { padding: 28, alignItems: 'center', gap: 12 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 4 },
  title: { fontSize: 24, fontFamily: 'Poppins_700Bold', letterSpacing: -0.3 },
  message: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  xpContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  xpText: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
  doneBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, marginTop: 4 },
  doneBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold' },
});
