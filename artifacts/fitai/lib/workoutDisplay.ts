import type { Workout, WorkoutCategory } from "@/constants/workouts";
import type { WorkoutLibraryEntry } from "@/contexts/FitnessContext";

export function resolveWorkoutDisplay(
  workout: Workout,
  customization: Record<string, WorkoutLibraryEntry>
): { displayName: string; accentCategory: WorkoutCategory } {
  const entry = customization[workout.id];
  const displayName = entry?.customName?.trim() || workout.name;
  const accentCategory = entry?.accentCategory ?? workout.category;
  return { displayName, accentCategory };
}
