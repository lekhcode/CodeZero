import type { RequestHandler } from "express";

/**
 * Wraps async route handlers so rejected promises call `next(err)` automatically.
 * This avoids repetitive try/catch in every async route (Express does not catch async throws).
 *
 * Pair with `ApiError` (or `next(err)`) in controllers/services — the global error handler formats JSON.
 */
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}
