import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import type { LoginBody, RegisterBody } from "./auth.validation.js";
import * as authService from "./auth.service.js";

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
