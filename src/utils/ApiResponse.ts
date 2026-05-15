import type { Response } from "express";

/**
 * Small helpers for consistent success JSON across modules.
 *
 * Pattern: `{ success: true, data: ... }` pairs with `{ success: false, error: ... }` from the
 * global error handler — easy for web/mobile clients to branch on `success`.
 */
export const ApiResponse = {
  success<T>(res: Response, data: T, statusCode = 200): void {
    res.status(statusCode).json({ success: true as const, data });
  },

  created<T>(res: Response, data: T): void {
    res.status(201).json({ success: true as const, data });
  },
} as const;
