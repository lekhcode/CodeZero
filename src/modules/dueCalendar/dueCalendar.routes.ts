import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateQuery } from "../../middleware/validate.middleware.js";
import * as dueCalendarController from "./dueCalendar.controller.js";
import {
  dueCalendarDayQuerySchema,
  dueCalendarSummaryQuerySchema,
} from "./dueCalendar.validation.js";

export const dueCalendarRouter = Router();

dueCalendarRouter.use(requireAuth);

dueCalendarRouter.get(
  "/summary",
  validateQuery(dueCalendarSummaryQuerySchema),
  asyncHandler(dueCalendarController.getSummary),
);

dueCalendarRouter.get(
  "/day",
  validateQuery(dueCalendarDayQuerySchema),
  asyncHandler(dueCalendarController.getDay),
);
