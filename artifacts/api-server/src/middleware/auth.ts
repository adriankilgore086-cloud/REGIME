import { getAuth, clerkMiddleware } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

export async function requirePremium(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { authUserId } = req as AuthenticatedRequest;

  try {
    const rows = await db
      .select({ isPremium: usersTable.isPremium })
      .from(usersTable)
      .where(eq(usersTable.id, authUserId))
      .limit(1);

    const isPremium = rows[0]?.isPremium ?? false;

    if (!isPremium) {
      res.status(403).json({
        error: "Premium subscription required",
        code: "PREMIUM_REQUIRED",
        status: 403,
      });
      return;
    }

    next();
  } catch (err) {
    res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR", status: 500 });
  }
}
