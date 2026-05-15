import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateParams } from "../../middleware/validate.middleware.js";
import { submissionIdParamsSchema } from "./compiler.validation.js";
import * as compilerController from "./compiler.controller.js";

/**
 * Compiler HTTP surface — mounted at `/api/v1/compiler`.
 * Playground POST /run removed — use online judge on `/api/v1/problems/:slug/run|submit`.
 */
export const compilerRouter = Router();

compilerRouter.get(
  "/submissions/:id",
  validateParams(submissionIdParamsSchema),
  asyncHandler(compilerController.getSubmission),
);
