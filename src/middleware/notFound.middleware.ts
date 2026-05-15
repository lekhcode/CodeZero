import type { RequestHandler } from "express";

/** Catch-all for unknown routes (before the error handler). Same error envelope as `ApiError` JSON. */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false as const,
    error: { message: "Not Found", code: "NOT_FOUND" },
  });
};
