import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import * as usersController from "./users.controller.js";

/**
 * User-facing profile routes. Protected endpoints chain `requireAuth` first.
 * Later: PATCH `/me` for preferences, avatar URLs, etc., still behind the same guard.
 */
export const usersRouter = Router();

usersRouter.get("/me", requireAuth, asyncHandler(usersController.me));
usersRouter.get("/me/learning-insights", requireAuth, asyncHandler(usersController.learningInsights));
