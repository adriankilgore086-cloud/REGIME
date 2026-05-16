import { getAuth, clerkMiddleware } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export type AuthenticatedRequest = Request & {
  authUserId: string;
};

export const attachClerkAuth = clerkMiddleware();

export function requireUser(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized", code: "UNAUTHORIZED", status: 401 });
    return;
  }

  (req as AuthenticatedRequest).authUserId = userId;
  next();
}
