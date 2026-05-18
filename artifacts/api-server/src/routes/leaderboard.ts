import { Router, type IRouter } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { getTopEntries, getUserRank } from "../services/leaderboard";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  const { authUserId } = req as AuthenticatedRequest;

  const [entries, myStats] = await Promise.all([
    getTopEntries(100),
    getUserRank(authUserId),
  ]);

  res.json({
    entries: entries.map((e) => ({
      userId: e.userId,
      username: `user_${e.userId.slice(0, 8)}`,
      displayName: "Regime Athlete",
      profileImage: null,
      rank: e.rank,
      xp: e.xp,
      streak: 0,
      sessions: 0,
      isPremium: false,
    })),
    myStats: myStats
      ? {
          userId: authUserId,
          username: `user_${authUserId.slice(0, 8)}`,
          displayName: "Regime Athlete",
          profileImage: null,
          rank: myStats.rank,
          xp: myStats.xp,
          streak: 0,
          sessions: 0,
          isPremium: false,
        }
      : {
          userId: authUserId,
          username: `user_${authUserId.slice(0, 8)}`,
          displayName: "Regime Athlete",
          profileImage: null,
          rank: entries.length + 1,
          xp: 0,
          streak: 0,
          sessions: 0,
          isPremium: false,
        },
  });
});

export default router;
