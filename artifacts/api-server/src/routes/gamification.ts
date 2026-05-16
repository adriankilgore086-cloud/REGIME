import { Router, type IRouter } from "express";
import { AwardXpBody } from "@workspace/api-zod";
import { validateBody } from "../middleware/validateBody";

const router: IRouter = Router();

const stats = {
  xp: 0,
  level: 1,
  rank: "Rookie",
  xpProgress: 0,
  streak: 0,
  longestStreak: 0,
  totalWorkouts: 0,
  caloriesBurned: 0,
  totalMinutes: 0,
  lastWorkoutDate: null,
  achievements: [],
};

router.get("/stats", (_req, res) => {
  res.json(stats);
});

router.post("/xp", validateBody(AwardXpBody), (req, res) => {
  res.json({ ...stats, xp: req.body.amount });
});

export default router;
