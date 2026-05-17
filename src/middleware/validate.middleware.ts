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

/**
 * Validates `req.query` (pagination, filters).
 * Stores coerced values on `req.validatedQuery` — Express 5 `req.query` is read-only.
 */
export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      next(ApiError.fromZod(parsed.error));
      return;
    }
    req.validatedQuery = parsed.data;
    next();
  };
}

/** Read query parsed by `validateQuery` in the same route chain. */
export function readValidatedQuery<T>(req: Request): T {
  if (req.validatedQuery === undefined) {
    throw new ApiError(500, "Query validation middleware did not run");
  }
  return req.validatedQuery as T;
}
