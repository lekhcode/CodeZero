import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateBody, validateParams } from "../../middleware/validate.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  adminTemplateBodySchema,
  adminTestcaseBodySchema,
  problemUuidParamsSchema,
} from "./judge.validation.js";
import * as ctrl from "./adminJudge.controller.js";

/**
 * POST /api/v1/problems/by-id/:problemId/templates
 * POST /api/v1/problems/by-id/:problemId/testcases
 */
export const problemByIdAdminRouter = Router();

problemByIdAdminRouter.post(
  "/:problemId/templates",
  requireAuth,
  validateParams(problemUuidParamsSchema),
  validateBody(adminTemplateBodySchema),
  asyncHandler(ctrl.addTemplate),
);

problemByIdAdminRouter.post(
  "/:problemId/testcases",
  requireAuth,
  validateParams(problemUuidParamsSchema),
  validateBody(adminTestcaseBodySchema),
  asyncHandler(ctrl.addTestcase),
);
