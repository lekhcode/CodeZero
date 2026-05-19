import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import {
  googleAuthBodySchema,
  loginBodySchema,
  registerBodySchema,
} from "./auth.validation.js";
import * as authController from "./auth.controller.js";

/**
 * Auth routes — mounted under `/api/v1/auth` from the central router.
 * Versioning here keeps mobile/web clients stable when `/api/v2` appears later.
 */
export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerBodySchema),
  asyncHandler(authController.register),
);

authRouter.post("/login", validateBody(loginBodySchema), asyncHandler(authController.login));

authRouter.post(
  "/google",
  validateBody(googleAuthBodySchema),
  asyncHandler(authController.googleAuth),
);

authRouter.get("/github/callback", asyncHandler(authController.githubCallback));
