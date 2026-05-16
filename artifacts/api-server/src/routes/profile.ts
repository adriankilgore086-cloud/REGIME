import { Router, type IRouter } from "express";
import { UpdateProfileBody } from "@workspace/api-zod";
import type { AuthenticatedRequest } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";

const router: IRouter = Router();

function profileFor(userId: string, patch: Record<string, unknown> = {}) {
  return {
    id: userId,
    name: (patch.name as string | undefined) ?? "Regime Athlete",
    username: (patch.username as string | undefined) ?? `user_${userId.slice(0, 8)}`,
    age: (patch.age as number | undefined) ?? 0,
    weight: (patch.weight as number | undefined) ?? 0,
    height: (patch.height as number | undefined) ?? 0,
    fitnessGoal: (patch.fitnessGoal as string | undefined) ?? "general",
    profileImage: (patch.profileImage as string | null | undefined) ?? null,
    bio: (patch.bio as string | null | undefined) ?? null,
    activeTitle: (patch.activeTitle as string | null | undefined) ?? null,
    unlockedTitles: ["The Grinder", "Elite Performer", "Iron Discipline"],
    isPremium: (patch.isPremium as boolean | undefined) ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

router.get("/", (req, res) => {
  const { authUserId } = req as AuthenticatedRequest;
  res.json(profileFor(authUserId));
});

router.patch("/", validateBody(UpdateProfileBody), (req, res) => {
  const { authUserId } = req as AuthenticatedRequest;
  res.json(profileFor(authUserId, req.body));
});

export default router;
