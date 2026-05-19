import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import type { GoogleAuthBody, LoginBody, RegisterBody } from "./auth.validation.js";
import * as authService from "./auth.service.js";
import * as authOAuthService from "./auth.oauth.service.js";
import { env } from "../../config/env.js";

/**
 * HTTP adapters only: parse validated body from middleware, call service, shape response.
 * Business rules live in `auth.service.ts` for reuse (CLI jobs, queues, MCP tools later).
 */

export async function register(req: Request, res: Response): Promise<void> {
  const body = req.body as RegisterBody;
  const result = await authService.registerUser(body);
  ApiResponse.created(res, result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginBody;
  const result = await authService.loginUser(body);
  ApiResponse.success(res, result);
}

export async function googleAuth(req: Request, res: Response): Promise<void> {
  const body = req.body as GoogleAuthBody;
  const result = await authOAuthService.loginWithGoogleCredential(body.credential);
  ApiResponse.success(res, result);
}

export async function githubCallback(req: Request, res: Response): Promise<void> {
  const codeRaw = req.query["code"];
  const code = typeof codeRaw === "string" ? codeRaw : "";
  if (code.length === 0) {
    res.redirect(`${env.FRONTEND_URL}/login?error=github_missing_code`);
    return;
  }

  const result = await authOAuthService.loginWithGithubCode(code);
  const format = req.query["format"];
  if (format === "json") {
    ApiResponse.success(res, result);
    return;
  }

  const token = encodeURIComponent(result.accessToken);
  res.redirect(`${env.FRONTEND_URL}/auth/github/success?token=${token}`);
}
