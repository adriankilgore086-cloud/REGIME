import type { OnboardingProfile, UserProfile } from "@/contexts/FitnessContext";
import type { DifficultyLevel, Workout, WorkoutCategory } from "@features/gamification/constants/workouts";

function intensityTier(pref: string): number {
  switch (pref) {
    case "Low": return 0;
    case "Moderate": return 1;
    case "High": return 2;
    case "Athlete": return 3;
    default: return 1;
  }
}

function difficultyTier(d: DifficultyLevel): number {
  switch (d) {
    case "beginner": return 0;
    case "intermediate": return 1;
    case "advanced": return 2;
    case "elite": return 3;
    default: return 1;
  }
}

function intensityFit(pref: string, diff: DifficultyLevel): number {
  const delta = Math.abs(intensityTier(pref) - difficultyTier(diff));
  if (delta === 0) return 4;
  if (delta === 1) return 2;
  return -1;
}

function goalBoost(category: WorkoutCategory, fitnessGoal: UserProfile["fitnessGoal"]): number {
  if (fitnessGoal === "weight_loss" && (category === "cardio" || category === "hiit" || category === "running")) return 3;
  if (fitnessGoal === "muscle_gain" && category === "strength") return 3;
  if (fitnessGoal === "strength" && category === "strength") return 3;
  if (fitnessGoal === "endurance" && (category === "cardio" || category === "running")) return 3;
  if (fitnessGoal === "general") return 1;
  return 0;
}

export function scoreWorkout(
  w: Workout,
  onboarding: OnboardingProfile,
  profile: UserProfile
): number {
  const motivation = onboarding.motivation || "Stay consistent";
  const hurdle = onboarding.biggestHurdle || "No clear plan";
  const frequency = onboarding.trainingFrequency || "3-4 days/week";
  const intensity = onboarding.preferredIntensity || "Moderate";

  let s = 2;

  if (motivation === "Lose fat") {
    if (w.category === "cardio" || w.category === "hiit") s += 5;
    if (w.category === "running") s += 3;
  } else if (motivation === "Build strength") {
    if (w.category === "strength") s += 6;
  } else if (motivation === "Stay consistent") {
    if (w.durationMinutes <= 45) s += 2;
    s += 1;
  } else if (motivation === "Boost confidence") {
    if (w.category === "hiit" || w.category === "strength") s += 4;
  }

  if (hurdle === "No time") {
    if (w.durationMinutes <= 30) s += 6;
    else if (w.durationMinutes <= 40) s += 2;
    else s -= 3;
  } else if (hurdle === "No motivation") {
    if (w.durationMinutes <= 35) s += 3;
    if (w.category === "recovery") s += 4;
  } else if (hurdle === "No clear plan") {
    s += 3;
    if (w.category === "strength" || w.category === "cardio") s += 1;
  } else if (hurdle === "Injury setbacks") {
    if (w.category === "recovery") s += 6;
    if (w.difficulty === "beginner" || w.difficulty === "intermediate") s += 2;
    if (w.difficulty === "elite") s -= 3;
  }

  if (frequency === "1-2 days/week") {
    if (w.durationMinutes >= 40) s += 2;
  } else if (frequency === "Daily") {
    if (w.category === "recovery" || w.durationMinutes <= 32) s += 3;
    if (w.difficulty === "elite") s -= 1;
  }

  s += intensityFit(intensity, w.difficulty);
  s += goalBoost(w.category, profile.fitnessGoal);

  return s;
}

export function rankWorkoutsForUser(workouts: Workout[], onboarding: OnboardingProfile, profile: UserProfile): Workout[] {
  const enriched = workouts.map((w) => ({ w, score: scoreWorkout(w, onboarding, profile) }));
  enriched.sort((a, b) => b.score - a.score);
  return enriched.map((x) => x.w);
}

export function pickDailyCurated(ranked: Workout[], fallback: Workout[]): Workout {
  const pool = ranked.length ? ranked : fallback;
  const iso = new Date().toISOString().split("T")[0];
  let h = 0;
  for (let i = 0; i < iso.length; i++) h = (h * 31 + iso.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % pool.length;
  return pool[idx];
}

export function buildWorkoutAiOverview(
  workout: Workout,
  onboarding: OnboardingProfile,
  profile: UserProfile
): string {
  const motivation = onboarding.motivation || "your stated motivation";
  const hurdle = onboarding.biggestHurdle || "your biggest hurdle";
  const frequency = onboarding.trainingFrequency || "your training cadence";
  const intensity = onboarding.preferredIntensity || "your preferred intensity";
  const goal = profile.fitnessGoal.replace("_", " ");

  const lines: string[] = [
    `Your onboarding profile lists motivation as "${motivation}", "${hurdle}" as the main hurdle, ${frequency} training, and ${intensity} intensity — alongside a "${goal}" fitness goal.`,
    "",
    `For ${workout.name}, the split favors ${workout.category.toUpperCase()} work at ${workout.difficulty} difficulty. Given "${hurdle}", this session ${hurdle === "No time" ? "keeps total time tight while preserving stimulus" : hurdle === "Injury setbacks" ? "prioritizes joint-friendly pacing and controlled volume" : "offers a clear structure so you can execute without second-guessing"}.`,
    "",
    `Intensity alignment: you asked for ${intensity} effort; this routine's prescription maps to ${workout.difficulty} demands — adjust rest or tempo if you need it ${intensity === "Low" ? "lighter" : intensity === "Athlete" ? "more aggressive" : "more sustainable"} while staying inside your ${frequency} cadence.`,
    "",
    `Muscle emphasis: ${workout.targetMuscles.slice(0, 5).join(", ")}. XP incentive (+${workout.xpReward}) matches longer-term consistency with ${motivation.toLowerCase()} as your north star.`,
  ];

  return lines.join("\n");
}
