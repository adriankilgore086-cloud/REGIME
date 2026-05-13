import type { WorkoutCategory } from "@/constants/workouts";

type AccentPalette = {
  primary: string;
  accent: string;
  success: string;
  purple: string;
  warning: string;
};

export function getWorkoutAccent(colors: AccentPalette, category: WorkoutCategory) {
  const main: Record<WorkoutCategory, string> = {
    strength: colors.primary,
    cardio: colors.accent,
    hiit: colors.warning,
    recovery: colors.success,
    running: colors.purple,
  };
  const base = main[category];
  return {
    main: base,
    gradient: [base + "22", base + "06"] as [string, string],
    borderTint: base + "35",
    chipBg: base + "20",
    chipBorder: base + "40",
    /** Short gradient header tint */
    subtleFill: base + "14",
  };
}

export const WORKOUT_CATEGORY_ORDER: WorkoutCategory[] = ["strength", "cardio", "hiit", "recovery", "running"];
