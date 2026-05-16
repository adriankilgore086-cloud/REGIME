import { useMemo } from "react";
import { getLevel, getRank, getXpProgress } from "@features/gamification/constants/workouts";

export function useXP(xp: number) {
  const level = useMemo(() => getLevel(xp), [xp]);
  const rank = useMemo(() => getRank(level), [level]);
  const xpProgress = useMemo(() => getXpProgress(xp), [xp]);

  return { level, rank, xpProgress };
}
