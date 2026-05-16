import { Router, type IRouter } from "express";
import { SyncAuthUserBody } from "@workspace/api-zod";
import { validateBody } from "../middleware/validateBody";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: IRouter = Router();

const toProfile = (userId: string, patch: { username?: string; displayName?: string; profileImage?: string }) => ({
  id: userId,
  name: patch.displayName ?? "Regime Athlete",
  username: patch.username ?? `user_${userId.slice(0, 8)}`,
  age: 0,
  weight: 0,
  height: 0,
  fitnessGoal: "general",
  profileImage: patch.profileImage ?? null,
  bio: null,
  activeTitle: null,
  unlockedTitles: ["The Grinder", "Elite Performer", "Iron Discipline"],
  isPremium: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

router.post("/sync", validateBody(SyncAuthUserBody), (req, res) => {
  const { authUserId } = req as AuthenticatedRequest;
  res.json(toProfile(authUserId, req.body));
});

export default router;
