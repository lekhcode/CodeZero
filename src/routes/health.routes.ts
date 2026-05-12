import { Router } from "express";

/**
 * Root routes stay minimal (health/version). Versioned APIs can mount under `/api/v1` later.
 */
export const rootRouter = Router();

rootRouter.get("/", (_req, res) => {
  res.type("text/plain").send("Backend Running 🚀");
});
