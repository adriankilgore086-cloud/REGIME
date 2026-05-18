import { Router, type IRouter } from "express";
import {
  CreateSocialCommentBody,
  CreateSocialReplyBody,
  CreateSocialPostBody,
  ReactToSocialPostBody,
} from "@workspace/api-zod";
import { validateBody } from "../middleware/validateBody";
import type { AuthenticatedRequest } from "../middleware/auth";
import { publish } from "../services/ably";
import { socialPostLimiter } from "../middleware/rateLimits";

const router: IRouter = Router();

router.get("/feed", (_req, res) => {
  res.json({ posts: [] });
});

router.post("/posts", socialPostLimiter, validateBody(CreateSocialPostBody), async (req, res) => {
  const { authUserId } = req as AuthenticatedRequest;

  const post = {
    id: `post_${Date.now()}`,
    userId: authUserId,
    userName: "Regime Athlete",
    userAvatar: "RA",
    userBadge: "The Grinder",
    reactions: { fire: [], flex: [], clap: [] },
    comments: [],
    createdAt: new Date(),
    ...req.body,
  };

  await publish("social:new-post", post);

  res.status(201).json(post);
});

router.delete("/posts/:id", (_req, res) => {
  res.status(204).send();
});

router.post("/posts/:id/react", validateBody(ReactToSocialPostBody), (req, res) => {
  res.json({
    id: req.params.id,
    userId: "system",
    userName: "Regime Athlete",
    userAvatar: "RA",
    userBadge: "The Grinder",
    type: "text",
    text: "",
    audience: "global",
    reactions: { fire: [], flex: [], clap: [] },
    comments: [],
    createdAt: new Date(),
  });
});

router.post("/posts/:id/comments", validateBody(CreateSocialCommentBody), (req, res) => {
  const { authUserId } = req as AuthenticatedRequest;
  res.status(201).json({
    id: `comment_${Date.now()}`,
    userId: authUserId,
    userName: "Regime Athlete",
    userAvatar: "RA",
    userBadge: "The Grinder",
    text: req.body.text,
    parentId: null,
    createdAt: new Date(),
  });
});

router.post("/posts/:id/comments/:commentId/replies", validateBody(CreateSocialReplyBody), (req, res) => {
  const { authUserId } = req as AuthenticatedRequest;
  res.status(201).json({
    id: `reply_${Date.now()}`,
    userId: authUserId,
    userName: "Regime Athlete",
    userAvatar: "RA",
    userBadge: "The Grinder",
    text: req.body.text,
    parentId: req.params.commentId,
    createdAt: new Date(),
  });
});

export default router;
