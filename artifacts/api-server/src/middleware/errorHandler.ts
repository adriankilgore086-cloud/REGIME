import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ error }, "Unhandled API error");

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    error: error instanceof Error ? error.message : "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
    status: 500,
  });
};
