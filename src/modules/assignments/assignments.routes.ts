import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import * as assignmentsController from "./assignments.controller.js";

/**
 * User-specific practice for today — joins `user_schedules` with `daily_potd` (and later plan pools).
 */
export const assignmentsRouter = Router();
assignmentsRouter.use(requireAuth);

assignmentsRouter.get("/today", asyncHandler(assignmentsController.getToday));
