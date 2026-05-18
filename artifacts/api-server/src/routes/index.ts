import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import authRouter from "./auth";
import profileRouter from "./profile";
import workoutsRouter from "./workouts";
import goalsRouter from "./goals";
import metricsRouter from "./metrics";
import gamificationRouter from "./gamification";
import socialRouter from "./social";
import leaderboardRouter from "./leaderboard";
import notificationsRouter from "./notifications";
import mediaRouter from "./media";
import { requireUser } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireUser);
router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/workouts", workoutsRouter);
router.use("/goals", goalsRouter);
router.use("/health", metricsRouter);
router.use("/gamification", gamificationRouter);
router.use("/social", socialRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/notifications", notificationsRouter);
router.use("/ai", aiRouter);
router.use("/media", mediaRouter);

export default router;
