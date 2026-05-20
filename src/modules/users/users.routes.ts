import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { optionalAuth } from "../../middleware/optionalAuth.middleware.js";
import { validateBody, validateQuery } from "../../middleware/validate.middleware.js";
import {
  checkUsernameQuerySchema,
  updateProfileBodySchema,
} from "./users.validation.js";
import * as usersController from "./users.controller.js";

export const usersRouter = Router();

usersRouter.get(
  "/check-username",
  optionalAuth,
  validateQuery(checkUsernameQuerySchema),
  asyncHandler(usersController.checkUsername),
);

usersRouter.get("/me", requireAuth, asyncHandler(usersController.me));

usersRouter.patch(
  "/me",
  requireAuth,
  validateBody(updateProfileBodySchema),
  asyncHandler(usersController.updateMe),
);

usersRouter.get("/me/learning-insights", requireAuth, asyncHandler(usersController.learningInsights));
usersRouter.get("/leaderboard", requireAuth, asyncHandler(usersController.leaderboard));
