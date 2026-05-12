import type { RequestHandler } from "express";

/** Catch-all for unknown routes (before the error handler). */
export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not Found" });
};
