import { Router, type IRouter } from "express";
import { CompleteWorkoutBody } from "@workspace/api-zod";
import { validateBody } from "../middleware/validateBody";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  res.json({ workouts: [] });
});

router.get("/history", (_req, res) => {
  res.json({ sessions: [] });
});

router.post("/complete", validateBody(CompleteWorkoutBody), (req, res) => {
  const now = new Date();
  const xpEarned = 0;

  res.json({
    session: {
      id: `session_${now.getTime()}`,
      workoutId: req.body.workoutId,
      scheduledWorkoutId: req.body.scheduledWorkoutId ?? null,
      completedAt: now,
      durationMinutes: req.body.durationMinutes ?? 0,
      calories: req.body.calories ?? 0,
      xpEarned,
    },
    stats: {
      xp: xpEarned,
      level: 1,
      rank: "Rookie",
      xpProgress: 0,
      streak: 0,
      longestStreak: 0,
      totalWorkouts: 1,
      caloriesBurned: req.body.calories ?? 0,
      totalMinutes: req.body.durationMinutes ?? 0,
      lastWorkoutDate: now.toISOString().slice(0, 10),
      achievements: [],
    },
    unlockedAchievements: [],
  });
});

export default router;
