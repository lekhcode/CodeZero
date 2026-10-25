import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validateBody, validateParams } from "../../middleware/validate.middleware.js";
import {
  createSessionBodySchema,
  postEventBodySchema,
  sessionIdParamsSchema,
  ttsBodySchema,
} from "./interviewer.validation.js";
import * as interviewerController from "./interviewer.controller.js";

export const interviewerRouter = Router();

interviewerRouter.get("/health", asyncHandler(interviewerController.health));

interviewerRouter.get("/voice/profile", asyncHandler(interviewerController.voiceProfile));

interviewerRouter.use(requireAuth);

interviewerRouter.post(
  "/tts",
  validateBody(ttsBodySchema),
  asyncHandler(interviewerController.synthesizeTts),
);

interviewerRouter.post(
  "/sessions",
  validateBody(createSessionBodySchema),
  asyncHandler(interviewerController.createSession),
);

interviewerRouter.get(
  "/sessions/:sessionId",
  validateParams(sessionIdParamsSchema),
  asyncHandler(interviewerController.getSession),
);

interviewerRouter.post(
  "/sessions/:sessionId/restore",
  validateParams(sessionIdParamsSchema),
  asyncHandler(interviewerController.restoreSession),
);

interviewerRouter.post(
  "/sessions/:sessionId/events",
  validateParams(sessionIdParamsSchema),
  validateBody(postEventBodySchema),
  asyncHandler(interviewerController.postEvent),
);

interviewerRouter.post(
  "/sessions/:sessionId/events/stream",
  validateParams(sessionIdParamsSchema),
  validateBody(postEventBodySchema),
  asyncHandler(interviewerController.postEventStream),
);
