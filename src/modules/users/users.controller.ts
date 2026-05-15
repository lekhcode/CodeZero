import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import * as usersService from "./users.service.js";

export async function me(req: Request, res: Response): Promise<void> {
  const authed = req.user;
  if (authed === undefined) {
    throw ApiError.unauthorized("Not authenticated");
  }
  const profile = await usersService.getUserProfile(authed.id);
  ApiResponse.success(res, { user: profile });
}
