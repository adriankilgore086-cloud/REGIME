import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SAMPLE_WORKOUTS, getLevel, getRank, getXpProgress } from '@/constants/workouts';
import { ACHIEVEMENTS, Achievement, checkAchievements } from '@/constants/achievements';

const STORAGE_KEY = '@regime_data_v2';

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  fitnessGoal: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general';
}

export interface UserStats {
  xp: number;
  streak: number;
  longestStreak: number;
  totalWorkouts: number;
  caloriesBurned: number;
  totalMinutes: number;
  lastWorkoutDate: string | null;
}

export interface ScheduledWorkout {
  id: string;
  workoutId: string;
  date: string;
  completed: boolean;
  skipped: boolean;
  completedAt: string | null;
}

export interface Goal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: string;
  deadline: string | null;
  completed: boolean;
}

export interface EarnedAchievement {
  id: string;
  earnedAt: string;
}

export interface HealthMetric {
  date: string;
  calories: number;
  activeMinutes: number;
  muscleGroups: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'workout' | 'achievement' | 'streak' | 'ai';
  read: boolean;
  createdAt: string;
}

export interface RewardData {
  xp: number;
  message: string;
  achievement?: Achievement;
}

interface FitnessState {
  userProfile: UserProfile;
  userStats: UserStats;
  scheduledWorkouts: ScheduledWorkout[];
  goals: Goal[];
  earnedAchievements: EarnedAchievement[];
  healthMetrics: HealthMetric[];
  notifications: AppNotification[];
}

interface FitnessContextType extends FitnessState {
  level: number;
  rank: string;
  xpProgress: number;
  showReward: boolean;
  rewardData: RewardData | null;
  unreadCount: number;
  todaysWorkouts: ScheduledWorkout[];
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  scheduleWorkout: (workoutId: string, date: string) => Promise<void>;
  completeWorkout: (scheduledId: string) => Promise<void>;
  skipWorkout: (scheduledId: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'completed'>) => Promise<void>;
  updateGoalProgress: (goalId: string, value: number) => Promise<void>;
  dismissReward: () => void;
  markNotificationRead: (id: string) => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Athlete',
  age: 25,
  weight: 75,
  height: 175,
  fitnessGoal: 'muscle_gain',
};

const DEFAULT_STATS: UserStats = {
  xp: 1250,
  streak: 7,
  longestStreak: 12,
  totalWorkouts: 28,
  caloriesBurned: 14200,
  totalMinutes: 1840,
  lastWorkoutDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
};

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const DEFAULT_SCHEDULED: ScheduledWorkout[] = [
  { id: 'sw1', workoutId: 'w1', date: today, completed: false, skipped: false, completedAt: null },
  { id: 'sw2', workoutId: 'w3', date: today, completed: false, skipped: false, completedAt: null },
  { id: 'sw3', workoutId: 'w7', date: today, completed: false, skipped: false, completedAt: null },
  { id: 'sw4', workoutId: 'w2', date: yesterday, completed: true, skipped: false, completedAt: yesterday + 'T10:00:00Z' },
  { id: 'sw5', workoutId: 'w4', date: yesterday, completed: true, skipped: false, completedAt: yesterday + 'T12:00:00Z' },
];

const DEFAULT_GOALS: Goal[] = [
  { id: 'g1', title: 'Lose 5kg', targetValue: 5, currentValue: 2.3, unit: 'kg', category: 'weight', deadline: null, completed: false },
  { id: 'g2', title: 'Run 5K', targetValue: 5, currentValue: 3.2, unit: 'km', category: 'cardio', deadline: null, completed: false },
  { id: 'g3', title: 'Bench 100kg', targetValue: 100, currentValue: 82, unit: 'kg', category: 'strength', deadline: null, completed: false },
  { id: 'g4', title: 'Workout 5x/week', targetValue: 5, currentValue: 4, unit: 'days', category: 'consistency', deadline: null, completed: false },
];

const DEFAULT_EARNED: EarnedAchievement[] = [
  { id: 'a1', earnedAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: 'a2', earnedAt: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: 'a5', earnedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
];

const DEFAULT_HEALTH: HealthMetric[] = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
  calories: Math.floor(300 + Math.random() * 350),
  activeMinutes: Math.floor(30 + Math.random() * 50),
  muscleGroups: i % 3 === 0 ? ['Chest', 'Triceps'] : i % 3 === 1 ? ['Legs', 'Glutes'] : ['Back', 'Biceps'],
}));

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: '7-Day Streak!', message: "You're on fire! Keep your streak alive today.", type: 'streak', read: false, createdAt: new Date().toISOString() },
  { id: 'n2', title: 'New Workout Ready', message: 'Power Upper Body is scheduled for today.', type: 'workout', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n3', title: 'AI Insight', message: "You haven't trained legs in 2 days. Consider a leg workout today.", type: 'ai', read: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
];

const FitnessContext = createContext<FitnessContextType | null>(null);

const DEFAULT_STATE: FitnessState = {
  userProfile: DEFAULT_PROFILE,
  userStats: DEFAULT_STATS,
  scheduledWorkouts: DEFAULT_SCHEDULED,
  goals: DEFAULT_GOALS,
  earnedAchievements: DEFAULT_EARNED,
  healthMetrics: DEFAULT_HEALTH,
  notifications: DEFAULT_NOTIFICATIONS,
};

export function FitnessProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FitnessState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState<RewardData | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<FitnessState>;
          setState((s) => ({ ...s, ...saved }));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const save = useCallback(async (newState: FitnessState) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  }, []);

  const updateState = useCallback(async (updater: (s: FitnessState) => FitnessState) => {
    setState((prev) => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, [save]);

  const updateProfile = useCallback(async (profile: Partial<UserProfile>) => {
    await updateState((s) => ({ ...s, userProfile: { ...s.userProfile, ...profile } }));
  }, [updateState]);

  const scheduleWorkout = useCallback(async (workoutId: string, date: string) => {
    const newScheduled: ScheduledWorkout = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      workoutId,
      date,
      completed: false,
      skipped: false,
      completedAt: null,
    };
    await updateState((s) => ({ ...s, scheduledWorkouts: [...s.scheduledWorkouts, newScheduled] }));
  }, [updateState]);

  const completeWorkout = useCallback(async (scheduledId: string) => {
    let xpEarned = 0;
    let newAchievements: Achievement[] = [];

    setState((prev) => {
      const sw = prev.scheduledWorkouts.find((w) => w.id === scheduledId);
      if (!sw) return prev;
      const workout = SAMPLE_WORKOUTS.find((w) => w.id === sw.workoutId);
      xpEarned = workout?.xpReward ?? 100;

      const today2 = new Date().toISOString().split('T')[0];
      const lastDate = prev.userStats.lastWorkoutDate;
      const yesterday2 = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = lastDate === yesterday2 || lastDate === today2
        ? prev.userStats.streak + (lastDate === today2 ? 0 : 1)
        : 1;

      const newStats: UserStats = {
        ...prev.userStats,
        xp: prev.userStats.xp + xpEarned,
        streak: newStreak,
        longestStreak: Math.max(prev.userStats.longestStreak, newStreak),
        totalWorkouts: prev.userStats.totalWorkouts + 1,
        caloriesBurned: prev.userStats.caloriesBurned + (workout?.calories ?? 300),
        totalMinutes: prev.userStats.totalMinutes + (workout?.durationMinutes ?? 30),
        lastWorkoutDate: today2,
      };

      const earnedIds = prev.earnedAchievements.map((a) => a.id);
      const level = getLevel(newStats.xp);
      newAchievements = checkAchievements(
        { totalWorkouts: newStats.totalWorkouts, streak: newStats.streak, caloriesBurned: newStats.caloriesBurned, level },
        earnedIds
      );

      const newEarned: EarnedAchievement[] = [
        ...prev.earnedAchievements,
        ...newAchievements.map((a) => ({ id: a.id, earnedAt: new Date().toISOString() })),
      ];

      const newHealthEntry: HealthMetric = {
        date: today2,
        calories: workout?.calories ?? 300,
        activeMinutes: workout?.durationMinutes ?? 30,
        muscleGroups: workout?.targetMuscles ?? [],
      };

      const healthFiltered = prev.healthMetrics.filter((h) => h.date !== today2);

      const next: FitnessState = {
        ...prev,
        userStats: newStats,
        scheduledWorkouts: prev.scheduledWorkouts.map((w) =>
          w.id === scheduledId ? { ...w, completed: true, completedAt: new Date().toISOString() } : w
        ),
        earnedAchievements: newEarned,
        healthMetrics: [newHealthEntry, ...healthFiltered].slice(0, 30),
      };
      save(next);
      return next;
    });

    setTimeout(() => {
      setRewardData({
        xp: xpEarned,
        message: newAchievements.length > 0 ? `Achievement Unlocked: ${newAchievements[0].name}!` : 'Workout Complete!',
        achievement: newAchievements[0],
      });
      setShowReward(true);
    }, 300);
  }, [save]);

  const skipWorkout = useCallback(async (scheduledId: string) => {
    await updateState((s) => ({
      ...s,
      scheduledWorkouts: s.scheduledWorkouts.map((w) =>
        w.id === scheduledId ? { ...w, skipped: true } : w
      ),
    }));
  }, [updateState]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'completed'>) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      completed: false,
    };
    await updateState((s) => ({ ...s, goals: [...s.goals, newGoal] }));
  }, [updateState]);

  const updateGoalProgress = useCallback(async (goalId: string, value: number) => {
    await updateState((s) => ({
      ...s,
      goals: s.goals.map((g) =>
        g.id === goalId ? { ...g, currentValue: value, completed: value >= g.targetValue } : g
      ),
    }));
  }, [updateState]);

  const dismissReward = useCallback(() => {
    setShowReward(false);
    setRewardData(null);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => {
      const next = { ...prev, notifications: prev.notifications.map((n) => n.id === id ? { ...n, read: true } : n) };
      save(next);
      return next;
    });
  }, [save]);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newN: AppNotification = { ...n, id: Date.now().toString(), createdAt: new Date().toISOString(), read: false };
    setState((prev) => {
      const next = { ...prev, notifications: [newN, ...prev.notifications] };
      save(next);
      return next;
    });
  }, [save]);

  const level = getLevel(state.userStats.xp);
  const rank = getRank(level);
  const xpProgress = getXpProgress(state.userStats.xp);
  const todaysWorkouts = state.scheduledWorkouts.filter((sw) => sw.date === today && !sw.completed && !sw.skipped);
  const unreadCount = state.notifications.filter((n) => !n.read).length;

  return (
    <FitnessContext.Provider value={{
      ...state,
      level,
      rank,
      xpProgress,
      showReward,
      rewardData,
      unreadCount,
      todaysWorkouts,
      updateProfile,
      scheduleWorkout,
      completeWorkout,
      skipWorkout,
      addGoal,
      updateGoalProgress,
      dismissReward,
      markNotificationRead,
      addNotification,
    }}>
      {children}
    </FitnessContext.Provider>
  );
}

export function useFitness() {
  const ctx = useContext(FitnessContext);
  if (!ctx) throw new Error('useFitness must be used within FitnessProvider');
  return ctx;
}
