import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateQuery } from "../../middleware/validate.middleware.js";
import * as userAssignmentsController from "./userAssignments.controller.js";
import { assignmentHistoryQuerySchema } from "./userAssignments.validation.js";

export const userAssignmentsRouter = Router();

userAssignmentsRouter.use(requireAuth);

userAssignmentsRouter.get("/today", asyncHandler(userAssignmentsController.getToday));
userAssignmentsRouter.get("/due", asyncHandler(userAssignmentsController.getDue));
userAssignmentsRouter.get(
  "/history",
  validateQuery(assignmentHistoryQuerySchema),
  asyncHandler(userAssignmentsController.getHistory),
);
