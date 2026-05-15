import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as scheduleTemplatesController from "./scheduleTemplates.controller.js";

/**
 * Public catalog — no auth so mobile/web can render picker before signup.
 */
export const scheduleTemplatesRouter = Router();

scheduleTemplatesRouter.get("/", asyncHandler(scheduleTemplatesController.list));
