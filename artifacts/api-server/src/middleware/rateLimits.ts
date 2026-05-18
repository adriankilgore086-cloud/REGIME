import { rateLimit } from "express-rate-limit";

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;

function keyFromAuth(req: import("express").Request) {
  return (req as { authUserId?: string }).authUserId ?? req.ip ?? "anon";
}

/** 5 AI requests / minute per user */
export const aiCoachLimiter = rateLimit({
  windowMs: ONE_MINUTE,
  limit: 5,
  keyGenerator: keyFromAuth,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Rate limit exceeded", code: "RATE_LIMIT_AI", retryAfter: 60 },
});

/** 10 posts / hour per user */
export const socialPostLimiter = rateLimit({
  windowMs: ONE_HOUR,
  limit: 10,
  keyGenerator: keyFromAuth,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Rate limit exceeded", code: "RATE_LIMIT_SOCIAL", retryAfter: 3600 },
});

/** 10 auth-sync / minute per user */
export const authSyncLimiter = rateLimit({
  windowMs: ONE_MINUTE,
  limit: 10,
  keyGenerator: keyFromAuth,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Rate limit exceeded", code: "RATE_LIMIT_AUTH", retryAfter: 60 },
});

/** 5 push-token registrations / hour per user */
export const pushTokenLimiter = rateLimit({
  windowMs: ONE_HOUR,
  limit: 5,
  keyGenerator: keyFromAuth,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Rate limit exceeded", code: "RATE_LIMIT_PUSH", retryAfter: 3600 },
});
