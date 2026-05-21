import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  ChangePasswordConfirmBody,
  ForgotPasswordBody,
  GoogleAuthBody,
  OAuthCompleteRegistrationBody,
  LoginBody,
  RegisterBody,
  ResendOtpBody,
  ResetPasswordBody,
  VerifyEmailBody,
} from "./auth.validation.js";
import * as authService from "./auth.service.js";
import * as authOAuthService from "./auth.oauth.service.js";
import { env } from "../../config/env.js";

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as RegisterBody;
  const result = await authService.registerUser(body);
  ApiResponse.created(res, result);
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const body = req.body as VerifyEmailBody;
  const result = await authService.verifyEmail(body);
  ApiResponse.success(res, result);
}

export async function resendOtp(req: Request, res: Response): Promise<void> {
  const body = req.body as ResendOtpBody;
  const result = await authService.resendVerificationOtp(body);
  ApiResponse.success(res, result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginBody;
  const result = await authService.loginUser(body);
  ApiResponse.success(res, result);
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const body = req.body as ForgotPasswordBody;
  const result = await authService.forgotPassword(body);
  ApiResponse.success(res, result);
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const body = req.body as ResetPasswordBody;
  const result = await authService.resetPassword(body);
  ApiResponse.success(res, result);
}

export async function requestChangePasswordOtp(req: Request, res: Response): Promise<void> {
  const authed = req.user;
  if (authed === undefined) throw ApiError.unauthorized("Not authenticated");
  const result = await authService.requestChangePasswordOtp(authed.id);
  ApiResponse.success(res, result);
}

export async function confirmChangePassword(req: Request, res: Response): Promise<void> {
  const authed = req.user;
  if (authed === undefined) throw ApiError.unauthorized("Not authenticated");
  const body = req.body as ChangePasswordConfirmBody;
  const result = await authService.confirmChangePassword(authed.id, body);
  ApiResponse.success(res, result);
}

export async function logout(req: Request, res: Response): Promise<void> {
  const authed = req.user;
  if (authed === undefined) throw ApiError.unauthorized("Not authenticated");
  await authService.logoutUser(authed.id);
  ApiResponse.success(res, { message: "Signed out" });
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  const body = req.body as GoogleAuthBody;
  const result = await authOAuthService.loginWithGoogleCredential(body.credential, body.intent);
  ApiResponse.success(res, result);
}

export async function oauthCompleteRegistration(req: Request, res: Response): Promise<void> {
  const body = req.body as OAuthCompleteRegistrationBody;
  const result = await authOAuthService.completeOAuthRegistration({
    pendingToken: body.pendingToken,
    fullName: body.fullName,
    country: body.country,
    gender: body.gender,
    ...(body.username !== undefined ? { username: body.username } : {}),
  });
  ApiResponse.success(res, result);
}

function parseOAuthIntent(raw: unknown): authOAuthService.OAuthIntent {
  return raw === "register" ? "register" : "login";
}

export async function githubCallback(req: Request, res: Response): Promise<void> {
  const codeRaw = req.query["code"];
  const code = typeof codeRaw === "string" ? codeRaw : "";
  if (code.length === 0) {
    res.redirect(`${env.FRONTEND_URL}/login?error=github_missing_code`);
    return;
  }

  const redirectUriRaw = req.query["redirect_uri"];
  const redirectUri =
    typeof redirectUriRaw === "string" && redirectUriRaw.length > 0 ? redirectUriRaw : undefined;

  const intentRaw = req.query["intent"];
  const intent = parseOAuthIntent(typeof intentRaw === "string" ? intentRaw : undefined);

  const result = await authOAuthService.loginWithGithubCode(code, redirectUri, intent);
  const format = req.query["format"];
  if (format === "json") {
    ApiResponse.success(res, result);
    return;
  }

  if ("status" in result && result.status === "pending_registration") {
    const pending = encodeURIComponent(result.pendingToken);
    res.redirect(`${env.FRONTEND_URL}/register/oauth/complete?pendingToken=${pending}`);
    return;
  }

  const login = result as { accessToken: string };
  const token = encodeURIComponent(login.accessToken);
  res.redirect(`${env.FRONTEND_URL}/auth/github/success?token=${token}`);
}
