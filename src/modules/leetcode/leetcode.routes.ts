import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateBody, validateParams } from "../../middleware/validate.middleware.js";
import { optionalAuth } from "../../middleware/optionalAuth.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { problemSlugParamsSchema } from "./leetcode.validation.js";
import { judgeCodeBodySchema, judgeSubmitCodeBodySchema } from "../../compiler/api/judge.validation.js";
import * as leetcodeController from "./leetcode.controller.js";
import * as problemJudgeController from "../../compiler/api/problemJudge.controller.js";

export const leetcodeRouter = Router();
leetcodeRouter.get("/", asyncHandler(leetcodeController.getDailyProblem));

export const problemsRouter = Router();

problemsRouter.get(
  "/:slug/judge-meta",
  optionalAuth,
  validateParams(problemSlugParamsSchema),
  asyncHandler(problemJudgeController.judgeMeta),
);

problemsRouter.post(
  "/:slug/run",
  requireAuth,
  validateParams(problemSlugParamsSchema),
  validateBody(judgeCodeBodySchema),
  asyncHandler(problemJudgeController.judgeRun),
);

problemsRouter.post(
  "/:slug/submit",
  requireAuth,
  validateParams(problemSlugParamsSchema),
  validateBody(judgeSubmitCodeBodySchema),
  asyncHandler(problemJudgeController.judgeSubmit),
);

problemsRouter.get(
  "/:slug",
  validateParams(problemSlugParamsSchema),
  asyncHandler(leetcodeController.getProblemBySlug),
);
