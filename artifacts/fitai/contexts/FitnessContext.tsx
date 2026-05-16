import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useUser } from "@clerk/expo";
import { SAMPLE_WORKOUTS, getLevel, getRank, getXpProgress, type WorkoutCategory } from '@features/gamification/constants/workouts';
import { ACHIEVEMENTS, Achievement, checkAchievements } from '@features/gamification/constants/achievements';

const STORAGE_KEY = '@regime_data_v2';
const USER_PREFIX = '@regime_user_';

export interface UserProfile {
  name: string;
  username: string;
  age: number;
  weight: number;
  height: number;
  fitnessGoal: 'weight_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general';
  profileImage?: string | null;
  bio?: string;
  activeTitle?: string;
  unlockedTitles: string[];
  isPremium: boolean;
}

export interface OnboardingProfile {
  motivation: string;
  biggestHurdle: string;
  trainingFrequency: string;
  preferredIntensity: string;
  healthPermissionsRequested: boolean;
  notificationsRequested: boolean;
  completedAt: string | null;
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
  steps?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'workout' | 'achievement' | 'streak' | 'ai' | 'social';
  read: boolean;
  createdAt: string;
  route?: string;
}

export interface RewardData {
  xp: number;
  message: string;
  achievement?: Achievement;
}

export interface WorkoutLibraryEntry {
  customName?: string;
  accentCategory?: WorkoutCategory;
}

interface FitnessState {
  userProfile: UserProfile;
  onboardingProfile: OnboardingProfile;
  userStats: UserStats;
  scheduledWorkouts: ScheduledWorkout[];
  goals: Goal[];
  earnedAchievements: EarnedAchievement[];
  healthMetrics: HealthMetric[];
  notifications: AppNotification[];
  pendingSyncCount: number;
  lastGlobalRefreshUtc: string | null;
  lastHealthSyncAt: string | null;
  workoutLibraryCustomization: Record<string, WorkoutLibraryEntry>;
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
  updateOnboardingProfile: (profile: Partial<OnboardingProfile>) => Promise<void>;
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
  syncHealthData: () => Promise<void>;
  updateWorkoutLibraryCustomization: (workoutId: string, patch: Partial<WorkoutLibraryEntry>) => Promise<void>;
}

const createEmptyState = (): FitnessState => ({
  userProfile: {
    name: "",
    username: "",
    age: 0,
    weight: 0,
    height: 0,
    fitnessGoal: "general",
    unlockedTitles: ["The Grinder", "Elite Performer", "Iron Discipline"],
    isPremium: false,
  },
  onboardingProfile: {
    motivation: "",
    biggestHurdle: "",
    trainingFrequency: "",
    preferredIntensity: "",
    healthPermissionsRequested: false,
    notificationsRequested: false,
    completedAt: null,
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
  pendingSyncCount: 0,
  lastGlobalRefreshUtc: null,
  lastHealthSyncAt: null,
  workoutLibraryCustomization: {},
});

const FitnessContext = createContext<FitnessContextType | null>(null);

export function FitnessProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [state, setState] = useState<FitnessState>(createEmptyState());
  const [loaded, setLoaded] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardData, setRewardData] = useState<RewardData | null>(null);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const onlineRef = useRef(true);
  const utcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const healthSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          setState((s) => ({
            ...createEmptyState(),
            ...s,
            ...saved,
            workoutLibraryCustomization: saved.workoutLibraryCustomization ?? createEmptyState().workoutLibraryCustomization,
          }));
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

  const checkOnline = useCallback(async () => {
    try {
      const res = await fetch("https://www.gstatic.com/generate_204", { method: "GET" });
      onlineRef.current = res.ok;
      return res.ok;
    } catch {
      onlineRef.current = false;
      return false;
    }
  }, []);

  const updateWorkoutLibraryCustomization = useCallback(async (workoutId: string, patch: Partial<WorkoutLibraryEntry>) => {
    await updateState((s) => ({
      ...s,
      workoutLibraryCustomization: {
        ...s.workoutLibraryCustomization,
        [workoutId]: { ...s.workoutLibraryCustomization[workoutId], ...patch },
      },
    }));
  }, [updateState]);

  const syncHealthData = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    let steps = 0;
    try {
      const sensors = await import("expo-sensors");
      if ("Pedometer" in sensors) {
        const pedometer = (sensors as any).Pedometer;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        const result = await pedometer.getStepCountAsync(start, end);
        steps = Number(result?.steps ?? 0);
      }
    } catch {
      // Best-effort health integration; keep app stable when API is unavailable.
    }

    const estimatedCalories = Math.round(steps * 0.04);
    await updateState((s) => {
      const existing = s.healthMetrics.find((h) => h.date === today);
      const merged: HealthMetric = {
        date: today,
        calories: Math.max(existing?.calories ?? 0, estimatedCalories),
        activeMinutes: existing?.activeMinutes ?? Math.round(steps / 100),
        muscleGroups: existing?.muscleGroups ?? [],
        steps,
      };
      const rest = s.healthMetrics.filter((h) => h.date !== today);
      return {
        ...s,
        healthMetrics: [merged, ...rest].slice(0, 45),
        lastHealthSyncAt: new Date().toISOString(),
      };
    });
  }, [updateState]);

  const runUtcRefresh = useCallback(async () => {
    await syncHealthData();
    await updateState((s) => ({
      ...s,
      lastGlobalRefreshUtc: new Date().toISOString(),
      notifications: [{
        id: Date.now().toString() + "utc",
        title: "Daily Sync Complete",
        message: "Leaderboard and daily statuses refreshed for the new UTC day.",
        type: "ai",
        read: false,
        createdAt: new Date().toISOString(),
        route: "/leaderboard",
      }, ...s.notifications],
    }));
  }, [syncHealthData, updateState]);

  useEffect(() => {
    if (!userId) return;
    const scheduleUtcRefresh = () => {
      if (utcTimerRef.current) clearTimeout(utcTimerRef.current);
      const now = new Date();
      const nextUtcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
      const delay = Math.max(nextUtcMidnight - now.getTime(), 1000);
      utcTimerRef.current = setTimeout(async () => {
        await runUtcRefresh();
        scheduleUtcRefresh();
      }, delay);
    };
    scheduleUtcRefresh();
    return () => {
      if (utcTimerRef.current) clearTimeout(utcTimerRef.current);
    };
  }, [runUtcRefresh, userId]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    const run = async () => {
      const isOnline = await checkOnline();
      if (!mounted) return;
      if (isOnline) {
        setState((prev) => {
          if (prev.pendingSyncCount === 0) return prev;
          const next = { ...prev, pendingSyncCount: 0 };
          save(next);
          return next;
        });
      }
    };
    run();
    healthSyncIntervalRef.current = setInterval(run, 60000);
    return () => {
      mounted = false;
      if (healthSyncIntervalRef.current) clearInterval(healthSyncIntervalRef.current);
    };
  }, [checkOnline, save, userId]);

  useEffect(() => {
    if (!userId) return;
    void syncHealthData();
  }, [syncHealthData, userId]);

  const updateProfile = useCallback(async (profile: Partial<UserProfile>) => {
    await updateState((s) => {
      const merged = { ...s.userProfile, ...profile };
      if (profile.name !== undefined) {
        merged.username = "@" + profile.name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      }
      return { ...s, userProfile: merged };
    });
  }, [updateState]);

  const updateOnboardingProfile = useCallback(async (profile: Partial<OnboardingProfile>) => {
    await updateState((s) => ({
      ...s,
      onboardingProfile: { ...s.onboardingProfile, ...profile },
    }));
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
      pendingSyncCount: onlineRef.current ? s.pendingSyncCount : s.pendingSyncCount + 1,
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
      pendingSyncCount: onlineRef.current ? s.pendingSyncCount : s.pendingSyncCount + 1,
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
        pendingSyncCount: onlineRef.current ? prev.pendingSyncCount : prev.pendingSyncCount + 1,
        userStats: newStats,
        scheduledWorkouts: prev.scheduledWorkouts.map((w) =>
          w.id === scheduledId ? { ...w, completed: true, completedAt: new Date().toISOString() } : w
        ),
        earnedAchievements: newEarned,
        healthMetrics: [newHealthEntry, ...healthFiltered].slice(0, 30),
        notifications: [
          {
            id: Date.now().toString() + "n",
            title: "Workout Complete 💪",
            message: `+${xpEarned} XP earned — streak alive!`,
            type: "workout" as const,
            read: false,
            createdAt: new Date().toISOString(),
            route: "/(tabs)",
          },
          ...newAchievements.map((a, i) => ({
            id: Date.now().toString() + "a" + i,
            title: "Achievement Unlocked 🏆",
            message: a.name,
            type: "achievement" as const,
            read: false,
            createdAt: new Date().toISOString(),
            route: "/(tabs)/profile",
          })),
          ...prev.notifications,
        ],
      };
      save(next);
      return next;
    });

    setTimeout(() => {
      if (!isMountedRef.current) return;
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
      pendingSyncCount: onlineRef.current ? s.pendingSyncCount : s.pendingSyncCount + 1,
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
    await updateState((s) => ({ ...s, pendingSyncCount: onlineRef.current ? s.pendingSyncCount : s.pendingSyncCount + 1, goals: [...s.goals, newGoal] }));
  }, [updateState]);

  const updateGoalProgress = useCallback(async (goalId: string, value: number) => {
    await updateState((s) => ({
      ...s,
      pendingSyncCount: onlineRef.current ? s.pendingSyncCount : s.pendingSyncCount + 1,
      goals: s.goals.map((g) =>
        g.id === goalId ? { ...g, currentValue: value, completed: value >= g.targetValue } : g
      ),
    }));
  }, [updateState]);

  const deleteGoal = useCallback(async (goalId: string) => {
    await updateState((s) => ({
      ...s,
      pendingSyncCount: onlineRef.current ? s.pendingSyncCount : s.pendingSyncCount + 1,
      goals: s.goals.filter((g) => g.id !== goalId),
    }));
  }, [updateState]);
  // ==========================================
  // CLERK <-> APP DATA SYNC
  // Automatically pulls login data into the app profile
  // ==========================================
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      updateProfile({
        name: user.fullName || user.firstName || "Athlete",
        username: user.username ? `@${user.username}` : undefined,
        profileImage: user.imageUrl,
      });
    }
  }, [user?.id, user?.username, user?.imageUrl, updateProfile]);


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
      updateOnboardingProfile,
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
      syncHealthData,
      updateWorkoutLibraryCustomization,
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
