import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateParams, validateQuery } from "../../middleware/validate.middleware.js";
import * as submissionsController from "./submissions.controller.js";
import {
  activityQuerySchema,
  listSubmissionsQuerySchema,
  submissionIdParamsSchema,
} from "./submissions.validation.js";

export const submissionsRouter = Router();

submissionsRouter.use(requireAuth);

submissionsRouter.get(
  "/",
  validateQuery(listSubmissionsQuerySchema),
  asyncHandler(submissionsController.list),
);

submissionsRouter.get(
  "/activity",
  validateQuery(activityQuerySchema),
  asyncHandler(submissionsController.getActivity),
);

submissionsRouter.get(
  "/:id",
  validateParams(submissionIdParamsSchema),
  asyncHandler(submissionsController.getById),
);
