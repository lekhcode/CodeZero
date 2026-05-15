import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../middleware/validate.middleware.js";
import {
  createUserScheduleBodySchema,
  userScheduleIdParamsSchema,
} from "./userSchedules.validation.js";
import * as userSchedulesController from "./userSchedules.controller.js";

/**
 * User-owned enrollments. All routes require auth — ownership is enforced in the service layer.
 */
export const userSchedulesRouter = Router();
userSchedulesRouter.use(requireAuth);

userSchedulesRouter.get("/", asyncHandler(userSchedulesController.list));
userSchedulesRouter.post(
  "/",
  validateBody(createUserScheduleBodySchema),
  asyncHandler(userSchedulesController.create),
);
userSchedulesRouter.patch(
  "/:id/toggle",
  validateParams(userScheduleIdParamsSchema),
  asyncHandler(userSchedulesController.toggle),
);
userSchedulesRouter.delete(
  "/:id",
  validateParams(userScheduleIdParamsSchema),
  asyncHandler(userSchedulesController.remove),
);
