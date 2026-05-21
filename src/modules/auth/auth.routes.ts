import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  changePasswordConfirmBodySchema,
  forgotPasswordBodySchema,
  googleAuthBodySchema,
  oauthCompleteRegistrationBodySchema,
  loginBodySchema,
  registerBodySchema,
  resendOtpBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
} from "./auth.validation.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerBodySchema),
  asyncHandler(authController.register),
);

authRouter.post(
  "/verify-email",
  validateBody(verifyEmailBodySchema),
  asyncHandler(authController.verifyEmail),
);

authRouter.post(
  "/resend-otp",
  validateBody(resendOtpBodySchema),
  asyncHandler(authController.resendOtp),
);

authRouter.post("/login", validateBody(loginBodySchema), asyncHandler(authController.login));

authRouter.post(
  "/forgot-password",
  validateBody(forgotPasswordBodySchema),
  asyncHandler(authController.forgotPassword),
);

authRouter.post(
  "/reset-password",
  validateBody(resetPasswordBodySchema),
  asyncHandler(authController.resetPassword),
);

authRouter.post(
  "/change-password/request-otp",
  requireAuth,
  asyncHandler(authController.requestChangePasswordOtp),
);

authRouter.post(
  "/change-password/confirm",
  requireAuth,
  validateBody(changePasswordConfirmBodySchema),
  asyncHandler(authController.confirmChangePassword),
);

authRouter.post("/logout", requireAuth, asyncHandler(authController.logout));

authRouter.post(
  "/google",
  validateBody(googleAuthBodySchema),
  asyncHandler(authController.googleAuth),
);

authRouter.post(
  "/oauth/complete-registration",
  validateBody(oauthCompleteRegistrationBodySchema),
  asyncHandler(authController.oauthCompleteRegistration),
);

authRouter.get("/github/callback", asyncHandler(authController.githubCallback));
