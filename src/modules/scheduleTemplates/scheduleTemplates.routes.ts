import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateParams } from "../../middleware/validate.middleware.js";
import * as scheduleTemplatesController from "./scheduleTemplates.controller.js";
import { templateSlugParamsSchema } from "./scheduleTemplates.validation.js";

/**
 * Public catalog — no auth so mobile/web can render picker before signup.
 */
export const scheduleTemplatesRouter = Router();

scheduleTemplatesRouter.get("/", asyncHandler(scheduleTemplatesController.list));
scheduleTemplatesRouter.get(
  "/:slug/preview",
  validateParams(templateSlugParamsSchema),
  asyncHandler(scheduleTemplatesController.preview),
);
