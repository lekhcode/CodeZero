import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError.js";

/**
 * Reusable Zod validation for request bodies.
 *
 * On success, replaces `req.body` with the parsed value (strings trimmed, coercions applied).
 * On failure, forwards a 422 `ApiError` with structured `details` for clients to highlight fields.
 */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(ApiError.fromZod(parsed.error));
      return;
    }
    req.body = parsed.data;
    next();
  };
}

/**
 * Validates `req.params` (e.g. `:id` UUIDs). Merges parsed values back onto `req.params` for handlers.
 */
export function validateParams<T extends Record<string, string>>(
  schema: ZodSchema<T>,
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      next(ApiError.fromZod(parsed.error));
      return;
    }
    Object.assign(req.params, parsed.data);
    next();
  };
}
