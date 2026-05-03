import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

interface Props {
  initialSeconds: number;
  onComplete?: () => void;
  label?: string;
  autoStart?: boolean;
  type?: 'workout' | 'rest' | 'total';
}

export function WorkoutTimer({ initialSeconds, onComplete, label = 'Timer', autoStart = false, type = 'workout' }: Props) {
  const colors = useColors();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(autoStart);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s - 1;
          if (next <= 3 && next > 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          if (next <= 0) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete?.();
            return 0;
          }
          return next;
        });
        setElapsed((e) => e + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  useEffect(() => {
    if (type === 'rest' && running) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [running, type]);

  const toggle = () => {
    setRunning((r) => !r);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const reset = () => {
    setRunning(false);
    setSeconds(initialSeconds);
    setElapsed(0);
  };

  const progress = type !== 'total' ? 1 - seconds / initialSeconds : elapsed / 3600;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const typeColor = type === 'rest' ? colors.success : type === 'workout' ? colors.primary : colors.accent;
  const gradColors: [string, string] = type === 'rest' ? ['#00E5A0', '#00B87A'] : type === 'workout' ? ['#00D4FF', '#0099CC'] : ['#FF2D78', '#CC1155'];

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: typeColor + '40' }]}>
        <Text style={[styles.label, { color: typeColor }]}>{label}</Text>
        <Text style={[styles.time, { color: colors.foreground }]}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <LinearGradient
            colors={gradColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]}
          />
        </View>
        <View style={styles.controls}>
          <TouchableOpacity onPress={reset} style={[styles.btn, { backgroundColor: colors.muted }]}>
            <Ionicons name="refresh" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggle} style={[styles.mainBtn, { backgroundColor: typeColor }]}>
            <Ionicons name={running ? 'pause' : 'play'} size={22} color="#08081A" />
          </TouchableOpacity>
          <View style={[styles.btn, { backgroundColor: colors.muted }]}>
            <Text style={[styles.elapsedText, { color: colors.mutedForeground }]}>+{elapsed}s</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {},
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 52,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -2,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elapsedText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
