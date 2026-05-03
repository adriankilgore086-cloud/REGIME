import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, PanResponder, Animated,
  Dimensions, TouchableOpacity,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Workout, CATEGORY_COLORS, CATEGORY_GRADIENTS, DifficultyLevel } from '@/constants/workouts';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = 110;

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  beginner: '#00E5A0',
  intermediate: '#00D4FF',
  advanced: '#FFB800',
  elite: '#FF2D78',
};

interface Props {
  workout: Workout;
  scheduledId: string;
  onComplete: (scheduledId: string) => void;
  onSkip: (scheduledId: string) => void;
  onPress: (workout: Workout) => void;
}

export function WorkoutSwipeCard({ workout, scheduledId, onComplete, onSkip, onPress }: Props) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = translateX.interpolate({ inputRange: [-width, 0, width], outputRange: ['-12deg', '0deg', '12deg'] });
  const [swiping, setSwiping] = useState<'left' | 'right' | null>(null);
  const categoryColor = CATEGORY_COLORS[workout.category];
  const [hasMounted, setHasMounted] = useState(false);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 8,
    onPanResponderGrant: () => { },
    onPanResponderMove: (_, gs) => {
      translateX.setValue(gs.dx);
      if (gs.dx > 50 && swiping !== 'right') {
        setSwiping('right');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (gs.dx < -50 && swiping !== 'left') {
        setSwiping('left');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (Math.abs(gs.dx) < 50) {
        setSwiping(null);
      }
    },
    onPanResponderRelease: (_, gs) => {
      if (gs.dx > SWIPE_THRESHOLD) {
        Animated.spring(translateX, { toValue: width * 1.5, useNativeDriver: true }).start(() => onComplete(scheduledId));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (gs.dx < -SWIPE_THRESHOLD) {
        Animated.spring(translateX, { toValue: -width * 1.5, useNativeDriver: true }).start(() => onSkip(scheduledId));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 40, friction: 5 }).start();
        setSwiping(null);
      }
    },
  })).current;

  const rightOpacity = translateX.interpolate({ inputRange: [0, 60, SWIPE_THRESHOLD], outputRange: [0, 0.5, 1] });
  const leftOpacity = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, -60, 0], outputRange: [1, 0.5, 0] });

  const diffColor = DIFFICULTY_COLORS[workout.difficulty];

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.container, { transform: [{ translateX }, { rotate }] }]}
    >
      <TouchableOpacity activeOpacity={0.97} onPress={() => onPress(workout)} style={styles.touchable}>
        <LinearGradient
          colors={['#131330', '#0A0A22']}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.categoryBar, { backgroundColor: categoryColor }]} />
          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={[styles.categoryChip, { backgroundColor: categoryColor + '20', borderColor: categoryColor + '40' }]}>
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {workout.category.toUpperCase()}
                </Text>
              </View>
              <View style={[styles.diffChip, { backgroundColor: diffColor + '20', borderColor: diffColor + '40' }]}>
                <Text style={[styles.diffText, { color: diffColor }]}>{workout.difficulty}</Text>
              </View>
            </View>

            <Text style={styles.workoutName}>{workout.name}</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
              {workout.description}
            </Text>

            <View style={styles.statsRow}>
              <StatPill icon="time-outline" value={`${workout.durationMinutes}m`} color={colors.primary} />
              <StatPill icon="flame-outline" value={`${workout.calories} cal`} color="#FF2D78" />
              <StatPill icon="barbell-outline" value={`${workout.exercises.length} exercises`} color={colors.mutedForeground} />
            </View>

            <View style={styles.muscles}>
              {workout.targetMuscles.slice(0, 4).map((m) => (
                <View key={m} style={[styles.muscleChip, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.muscleText, { color: colors.mutedForeground }]}>{m}</Text>
                </View>
              ))}
            </View>

            <View style={styles.hintsRow}>
              <View style={styles.hint}>
                <Feather name="arrow-left" size={14} color="#FF4B4B" />
                <Text style={[styles.hintText, { color: '#FF4B4B' }]}>Skip</Text>
              </View>
              <View style={[styles.xpBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.xpText, { color: colors.primary }]}>+{workout.xpReward} XP</Text>
              </View>
              <View style={styles.hint}>
                <Text style={[styles.hintText, { color: '#00E5A0' }]}>Complete</Text>
                <Feather name="arrow-right" size={14} color="#00E5A0" />
              </View>
            </View>
          </View>

          <Animated.View style={[styles.actionOverlay, styles.completeOverlay, { opacity: rightOpacity }]}>
            <View style={styles.actionContent}>
              <Ionicons name="checkmark-circle" size={56} color="#00E5A0" />
              <Text style={[styles.actionText, { color: '#00E5A0' }]}>DONE!</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.actionOverlay, styles.skipOverlay, { opacity: leftOpacity }]}>
            <View style={styles.actionContent}>
              <Ionicons name="close-circle" size={56} color="#FF4B4B" />
              <Text style={[styles.actionText, { color: '#FF4B4B' }]}>SKIP</Text>
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
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[styles.statText, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 12,
  },
  touchable: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#252550',
    minHeight: 240,
    position: 'relative',
  },
  categoryBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  diffChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  diffText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'capitalize',
  },
  workoutName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  statText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  muscles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  muscleChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  muscleText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
  },
  hintsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  completeOverlay: {
    backgroundColor: 'rgba(0,229,160,0.12)',
  },
  skipOverlay: {
    backgroundColor: 'rgba(255,75,75,0.12)',
  },
  actionContent: {
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 3,
  },
});
