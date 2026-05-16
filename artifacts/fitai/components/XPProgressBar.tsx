import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { XP_PER_LEVEL } from '@features/gamification/constants/workouts';

interface Props {
  xp: number;
  level: number;
  rank: string;
  xpProgress: number;
}

export function XPProgressBar({ xp, level, rank, xpProgress }: Props) {
  const colors = useColors();
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: xpProgress,
      useNativeDriver: false,
      tension: 40,
      friction: 7,
    }).start();
  }, [xpProgress]);

  const xpInLevel = xp % XP_PER_LEVEL;
  const xpNeeded = XP_PER_LEVEL - xpInLevel;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.rank, { color: colors.primary, fontFamily: 'Poppins_700Bold' }]}>{rank}</Text>
          <Text style={[styles.levelText, { color: colors.mutedForeground }]}>Level {level}</Text>
        </View>
        <View style={styles.xpInfo}>
          <Text style={[styles.xpValue, { color: colors.foreground }]}>{xpInLevel.toLocaleString()} XP</Text>
          <Text style={[styles.xpNeed, { color: colors.mutedForeground }]}>{xpNeeded} to next level</Text>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <Animated.View style={[styles.fill, {
          width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }]}>
          <LinearGradient
            colors={['#FFFFFF', '#D8D8D8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.shimmer} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  rank: { fontSize: 15, letterSpacing: 0.3 },
  levelText: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  xpInfo: { alignItems: 'flex-end' },
  xpValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  xpNeed: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 1 },
  track: { height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, overflow: 'hidden', position: 'relative' },
  shimmer: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 16, backgroundColor: 'rgba(255,255,255,0.25)' },
});
