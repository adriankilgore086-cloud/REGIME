import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "@clerk/expo";
import { SAMPLE_WORKOUTS, getLevel, getRank, getXpProgress } from '@/constants/workouts';
import { ACHIEVEMENTS, Achievement, checkAchievements } from '@/constants/achievements';

const STORAGE_KEY = '@regime_data_v2';
const USER_PREFIX = '@regime_user_';

export interface UserProfile {
  name: string;
  age: number;
  weight: number;
  height: number;
  fitnessGoal: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general';
  profileImage?: string | null;
  bio?: string;
  activeTitle?: string;
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
  description?: string;
  purpose?: string;
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
  unscheduleWorkout: (scheduledWorkoutId: string) => Promise<void>;
  completeWorkout: (scheduledId: string) => Promise<void>;
  skipWorkout: (scheduledId: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'completed'>) => Promise<void>;
  updateGoalProgress: (goalId: string, value: number) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  dismissReward: () => void;
  markNotificationRead: (id: string) => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
}

const createEmptyState = (): FitnessState => ({
  userProfile: {
    name: "",
    age: 0,
    weight: 0,
    height: 0,
    fitnessGoal: "general",
  },
  userStats: {
    xp: 0,
    streak: 0,
    longestStreak: 0,
    totalWorkouts: 0,
    caloriesBurned: 0,
    totalMinutes: 0,
    lastWorkoutDate: null,
  },
  scheduledWorkouts: [],
  goals: [],
  earnedAchievements: [],
  healthMetrics: [],
  notifications: [],
});

const FitnessContext = createContext<FitnessContextType | null>(null);

export function FitnessProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [state, setState] = useState<FitnessState>(createEmptyState());
  const [loaded, setLoaded] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState<RewardData | null>(null);

  useEffect(() => {
    setLoaded(false);
    setState(createEmptyState());
    if (!userId) {
      setLoaded(true);
      return;
    }
    AsyncStorage.getItem(`${USER_PREFIX}${userId}:${STORAGE_KEY}`).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as Partial<FitnessState>;
          setState((s) => ({ ...createEmptyState(), ...s, ...saved }));
        } catch {}
      }
      setLoaded(true);
    });
  }, [userId]);

  const save = useCallback(async (newState: FitnessState) => {
    if (!userId) return;
    await AsyncStorage.setItem(`${USER_PREFIX}${userId}:${STORAGE_KEY}`, JSON.stringify(newState));
  }, [userId]);

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
    const workout = SAMPLE_WORKOUTS.find((w) => w.id === workoutId);
    await updateState((s) => ({
      ...s,
      scheduledWorkouts: [...s.scheduledWorkouts, newScheduled],
      notifications: workout
        ? [
            {
              id: Date.now().toString() + "n",
              title: "Workout Scheduled",
              message: `${workout.name} is set for ${date}.`,
              type: "workout",
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...s.notifications,
          ]
        : s.notifications,
    }));
  }, [updateState]);

  const unscheduleWorkout = useCallback(async (scheduledWorkoutId: string) => {
    await updateState((s) => ({
      ...s,
      scheduledWorkouts: s.scheduledWorkouts.filter((w) => w.id !== scheduledWorkoutId),
    }));
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
        notifications: [
          {
            id: Date.now().toString() + "n",
            title: "Workout Complete",
            message: `You earned +${xpEarned} XP and kept your streak alive.`,
            type: "workout",
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev.notifications,
        ],
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

  const deleteGoal = useCallback(async (goalId: string) => {
    await updateState((s) => ({
      ...s,
      goals: s.goals.filter((g) => g.id !== goalId),
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

  const level = useMemo(() => getLevel(state.userStats.xp), [state.userStats.xp]);
  const rank = useMemo(() => getRank(level), [level]);
  const xpProgress = useMemo(() => getXpProgress(state.userStats.xp), [state.userStats.xp]);
  const todaysWorkouts = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return state.scheduledWorkouts.filter((sw) => sw.date === today && !sw.completed && !sw.skipped);
  }, [state.scheduledWorkouts]);
  const unreadCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications]
  );

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
      unscheduleWorkout,
      completeWorkout,
      skipWorkout,
      addGoal,
      updateGoalProgress,
      deleteGoal,
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
