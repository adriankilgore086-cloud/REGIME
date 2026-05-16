import { useCallback } from "react";
import {
  checkAchievements,
  type Achievement,
} from "@features/gamification/constants/achievements";

type AchievementStats = {
  totalWorkouts: number;
  streak: number;
  caloriesBurned: number;
  level: number;
};

export function useAchievements() {
  const checkUnlockedAchievements = useCallback(
    (stats: AchievementStats, earnedIds: string[]): Achievement[] =>
      checkAchievements(stats, earnedIds),
    [],
  );

  return { checkUnlockedAchievements };
}
