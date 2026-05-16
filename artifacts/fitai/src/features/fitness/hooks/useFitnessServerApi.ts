import {
  useCompleteWorkout,
  useCreateGoal,
  useCreateHealthMetric,
  useDeleteGoal,
  useGetGamificationStats,
  useGetGoals,
  useGetHealthMetrics,
  useGetNotifications,
  useGetProfile,
  useMarkNotificationsRead,
  useUpdateGoal,
  useUpdateProfile,
} from "@workspace/api-client-react";

export function useFitnessServerApi(enabled: boolean) {
  const queryOptions = {
    enabled,
    retry: 1,
    staleTime: 30_000,
  } as const;

  const profile = useGetProfile({ query: queryOptions as any });
  const goals = useGetGoals({ query: queryOptions as any });
  const healthMetrics = useGetHealthMetrics({ query: queryOptions as any });
  const gamificationStats = useGetGamificationStats({ query: queryOptions as any });
  const notifications = useGetNotifications({ query: queryOptions as any });

  return {
    profile,
    goals,
    healthMetrics,
    gamificationStats,
    notifications,
    updateProfile: useUpdateProfile(),
    createGoal: useCreateGoal(),
    updateGoal: useUpdateGoal(),
    deleteGoal: useDeleteGoal(),
    createHealthMetric: useCreateHealthMetric(),
    completeWorkout: useCompleteWorkout(),
    markNotificationsRead: useMarkNotificationsRead(),
  };
}
