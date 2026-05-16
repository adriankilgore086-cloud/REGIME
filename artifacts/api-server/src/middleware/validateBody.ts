import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

export function validateBody<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: result.error.message,
        code: "VALIDATION_ERROR",
        status: 400,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
