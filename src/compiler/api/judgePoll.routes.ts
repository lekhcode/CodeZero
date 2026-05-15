import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateParams } from "../../middleware/validate.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { judgeSubmissionIdParamsSchema } from "./judge.validation.js";
import * as pj from "./problemJudge.controller.js";

/** Poll judge submissions (`GET /api/v1/judge/submissions/:id`). */
export const judgePollRouter = Router();

judgePollRouter.get(
  "/submissions/:id",
  requireAuth,
  validateParams(judgeSubmissionIdParamsSchema),
  asyncHandler(pj.getJudgeSubmission),
);
