import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateParams } from "../../middleware/validate.middleware.js";
import { problemSlugParamsSchema } from "./leetcode.validation.js";
import * as leetcodeController from "./leetcode.controller.js";

/** Mounted at `/api/v1/daily-problem` — returns full parsed POTD (same shape as `/problems/:slug`). */
export const leetcodeRouter = Router();
leetcodeRouter.get("/", asyncHandler(leetcodeController.getDailyProblem));

/**
 * Problem detail by slug — mounted at `/api/v1/problems`.
 * Separate router keeps daily POTD vs catalog detail concerns isolated.
 */
export const problemsRouter = Router();
problemsRouter.get(
  "/:slug",
  validateParams(problemSlugParamsSchema),
  asyncHandler(leetcodeController.getProblemBySlug),
);
