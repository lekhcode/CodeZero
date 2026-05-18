import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Dump endpoints: if `LEETCODE_DUMP_TOKEN` is set, require `x-leetcode-dump-token` header.
 * Otherwise fall back to a normal authenticated session.
 */
export async function requireDumpAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = env.LEETCODE_DUMP_TOKEN;
  if (token.length > 0) {
    const header = req.header("x-leetcode-dump-token");
    if (header !== token) {
      next(new ApiError(401, "Invalid or missing dump token", { code: "DUMP_UNAUTHORIZED" }));
      return;
    }
    next();
    return;
  }
  await requireAuth(req, res, next);
}
