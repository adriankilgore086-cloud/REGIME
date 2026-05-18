import { Router, type IRouter } from "express";
import { MarkNotificationsReadBody, RegisterNotificationTokenBody } from "@workspace/api-zod";
import { validateBody } from "../middleware/validateBody";
import { pushTokenLimiter } from "../middleware/rateLimits";

const router: IRouter = Router();

router.get("/", (_req, res) => {
  res.json({ notifications: [] });
});

router.post("/read", validateBody(MarkNotificationsReadBody), (_req, res) => {
  res.json({ notifications: [] });
});

router.post("/token", pushTokenLimiter, validateBody(RegisterNotificationTokenBody), (_req, res) => {
  res.status(204).send();
});

router.delete("/token", (_req, res) => {
  res.status(204).send();
});

export default router;
