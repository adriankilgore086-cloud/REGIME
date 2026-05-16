import { Router, type IRouter } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";

const router: IRouter = Router();

router.get("/", (req, res) => {
  const { authUserId } = req as AuthenticatedRequest;
  const myStats = {
    userId: authUserId,
    username: `user_${authUserId.slice(0, 8)}`,
    displayName: "Regime Athlete",
    profileImage: null,
    rank: 1,
    xp: 0,
    streak: 0,
    sessions: 0,
    isPremium: false,
  };

  res.json({ entries: [myStats], myStats });
});

export default router;
