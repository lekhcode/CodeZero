import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../middleware/validate.middleware.js";
import {
  activityQuerySchema,
  feedQuerySchema,
  historyQuerySchema,
  logAutoRevisionBodySchema,
  monthQuerySchema,
  revisionIdParamsSchema,
  summaryQuerySchema,
  todayQuerySchema,
  weekQuerySchema,
} from "./autoRevision.validation.js";
import * as autoRevisionController from "./autoRevision.controller.js";

export const autoRevisionsRouter = Router();
autoRevisionsRouter.use(requireAuth);

autoRevisionsRouter.post(
  "/log",
  validateBody(logAutoRevisionBodySchema),
  asyncHandler(autoRevisionController.log),
);

autoRevisionsRouter.get(
  "/today",
  validateQuery(todayQuerySchema),
  asyncHandler(autoRevisionController.today),
);

autoRevisionsRouter.get(
  "/week",
  validateQuery(weekQuerySchema),
  asyncHandler(autoRevisionController.week),
);

autoRevisionsRouter.get(
  "/month",
  validateQuery(monthQuerySchema),
  asyncHandler(autoRevisionController.month),
);

autoRevisionsRouter.get(
  "/summary",
  validateQuery(summaryQuerySchema),
  asyncHandler(autoRevisionController.summary),
);

autoRevisionsRouter.get(
  "/feed",
  validateQuery(feedQuerySchema),
  asyncHandler(autoRevisionController.feed),
);

autoRevisionsRouter.get(
  "/history",
  validateQuery(historyQuerySchema),
  asyncHandler(autoRevisionController.history),
);

autoRevisionsRouter.get(
  "/activity",
  validateQuery(activityQuerySchema),
  asyncHandler(autoRevisionController.activity),
);

autoRevisionsRouter.patch(
  "/:id/mark-revised",
  validateParams(revisionIdParamsSchema),
  asyncHandler(autoRevisionController.markRevised),
);
