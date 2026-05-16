import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, PanResponder, Animated,
  Dimensions, TouchableOpacity, Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@shared/hooks/useColors';
import { Workout, DifficultyLevel, type WorkoutCategory } from '@features/gamification/constants/workouts';
import { getWorkoutAccent } from '@shared/theme/workoutAccents';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 110;

function difficultyAccent(diff: DifficultyLevel, colors: ReturnType<typeof useColors>) {
  switch (diff) {
    case 'beginner': return colors.success;
    case 'intermediate': return colors.purple;
    case 'advanced': return colors.warning;
    case 'elite': return colors.accent;
    default: return colors.mutedForeground;
  }
}

interface Props {
  workout: Workout;
  scheduledId: string;
  onComplete: (scheduledId: string) => void;
  onSkip: (scheduledId: string) => void;
  onPress: (workout: Workout) => void;
  displayName?: string;
  accentCategory?: WorkoutCategory;
}

export function WorkoutSwipeCard({ workout, scheduledId, onComplete, onSkip, onPress, displayName, accentCategory }: Props) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = translateX.interpolate({ inputRange: [-width, 0, width], outputRange: ['-10deg', '0deg', '10deg'] });
  const [swiping, setSwiping] = useState<'left' | 'right' | null>(null);
  const swipingRef = useRef<'left' | 'right' | null>(null);
  const accentCat = accentCategory ?? workout.category;
  const accent = getWorkoutAccent(colors, accentCat);
  const categoryColor = accent.main;

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 8,
    onPanResponderGrant: () => {},
    onPanResponderMove: (_, gs) => {
      translateX.setValue(gs.dx);
      if (gs.dx > 50 && swipingRef.current !== 'right') {
        swipingRef.current = 'right';
        setSwiping('right');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (gs.dx < -50 && swipingRef.current !== 'left') {
        swipingRef.current = 'left';
        setSwiping('left');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (Math.abs(gs.dx) < 50) {
        swipingRef.current = null;
        setSwiping(null);
      }
    },
    onPanResponderRelease: (_, gs) => {
      if (gs.dx > SWIPE_THRESHOLD) {
        Animated.spring(translateX, { toValue: width * 1.5, useNativeDriver: Platform.OS !== "web" }).start(() => onComplete(scheduledId));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (gs.dx < -SWIPE_THRESHOLD) {
        Animated.spring(translateX, { toValue: -width * 1.5, useNativeDriver: Platform.OS !== "web" }).start(() => onSkip(scheduledId));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: Platform.OS !== "web", tension: 40, friction: 5 }).start();
        setSwiping(null);
      }
    },
  })).current;

  const rightOpacity = translateX.interpolate({ inputRange: [0, 60, SWIPE_THRESHOLD], outputRange: [0, 0.4, 1] });
  const leftOpacity = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, -60, 0], outputRange: [1, 0.4, 0] });

  const diffColor = difficultyAccent(workout.difficulty, colors);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.container, { transform: [{ translateX }, { rotate }] }]}
    >
      <TouchableOpacity activeOpacity={0.97} onPress={() => onPress(workout)} style={styles.touchable}>
        <LinearGradient
          colors={['#1E1E1E', '#161616']}
          style={[styles.card, { borderColor: colors.border }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.categoryBar, { backgroundColor: categoryColor }]} />
          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={[styles.categoryChip, { backgroundColor: categoryColor + '18', borderColor: categoryColor + '35' }]}>
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {accentCat.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.diffChip, { backgroundColor: diffColor + '18', borderColor: diffColor + '35' }]}>
                <Text style={[styles.diffText, { color: diffColor }]}>{workout.difficulty}</Text>
              </View>
            </View>

            <Text style={[styles.workoutName, { color: colors.foreground }]}>{displayName ?? workout.name}</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
              {workout.description}
            </Text>

            <View style={styles.statsRow}>
              <StatPill icon="time-outline" value={`${workout.durationMinutes}m`} color={colors.primary} />
              <StatPill icon="flame-outline" value={`${workout.calories} cal`} color={colors.accent} />
              <StatPill icon="barbell-outline" value={`${workout.exercises.length} exercises`} color={colors.mutedForeground} />
            </View>

            <View style={styles.muscles}>
              {workout.targetMuscles.slice(0, 4).map((m) => (
                <View key={m} style={[styles.muscleChip, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.muscleText, { color: colors.mutedForeground }]}>{m}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.hintsRow, { borderTopColor: colors.border }]}>
              <View style={styles.hint}>
                <Feather name="arrow-left" size={13} color={colors.destructive} />
                <Text style={[styles.hintText, { color: colors.destructive }]}>Skip</Text>
              </View>
              <View style={[styles.xpBadge, { backgroundColor: colors.primary + '18' }]}>
                <Text style={[styles.xpText, { color: colors.primary }]}>+{workout.xpReward} XP</Text>
              </View>
              <View style={styles.hint}>
                <Text style={[styles.hintText, { color: colors.success }]}>Complete</Text>
                <Feather name="arrow-right" size={13} color={colors.success} />
              </View>
            </View>
          </View>

          <Animated.View style={[styles.actionOverlay, { opacity: rightOpacity, backgroundColor: 'rgba(123,224,184,0.1)' }]}>
            <View style={styles.actionContent}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
              <Text style={[styles.actionText, { color: colors.success, fontFamily: 'Poppins_700Bold' }]}>DONE!</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.actionOverlay, { opacity: leftOpacity, backgroundColor: 'rgba(255,85,85,0.1)' }]}>
            <View style={styles.actionContent}>
              <Ionicons name="close-circle" size={56} color={colors.destructive} />
              <Text style={[styles.actionText, { color: colors.destructive, fontFamily: 'Poppins_700Bold' }]}>SKIP</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StatPill({ icon, value, color }: { icon: string; value: string; color: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon as any} size={12} color={color} />
      <Text style={[styles.statText, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 12 },
  touchable: { borderRadius: 24, overflow: 'hidden' },
  card: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, minHeight: 240, position: 'relative' },
  categoryBar: { height: 3, width: '100%' },
  content: { padding: 20 },
  topRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  categoryText: { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  diffChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  diffText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  workoutName: { fontSize: 22, fontFamily: 'Poppins_700Bold', marginBottom: 6, letterSpacing: -0.3 },
  description: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10 },
  statText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  muscles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  muscleChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  muscleText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  hintsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hintText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  xpBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  xpText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  actionOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  actionContent: { alignItems: 'center', gap: 8 },
  actionText: { fontSize: 26, letterSpacing: 3 },
});
