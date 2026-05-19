import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.middleware.js";
import { catalogMetaQuerySchema, listProblemsQuerySchema } from "./leetcode.catalog.validation.js";
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
  "/stats",
  validateQuery(catalogMetaQuerySchema),
  asyncHandler(leetcodeController.getCatalogStats),
);

problemsRouter.get(
  "/topics",
  validateQuery(catalogMetaQuerySchema),
  asyncHandler(leetcodeController.listProblemTopics),
);

problemsRouter.get(
  "/",
  optionalAuth,
  validateQuery(listProblemsQuerySchema),
  asyncHandler(leetcodeController.listProblems),
);

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
