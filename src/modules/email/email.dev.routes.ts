import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { z } from "zod";
import * as emailDevController from "./email.dev.controller.js";

const testEmailBodySchema = z.object({
  to: z.string().email(),
  template: z.enum(["verification", "plain"]).optional(),
  subject: z.string().min(1).max(200).optional(),
});

export const emailDevRouter = Router();

emailDevRouter.post(
  "/test",
  validateBody(testEmailBodySchema),
  asyncHandler(emailDevController.sendTestEmail),
);
