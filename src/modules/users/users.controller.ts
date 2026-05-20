import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import * as usersService from "./users.service.js";
import { getLearningInsightsForUser } from "./learningInsights.service.js";
import { getLeaderboard } from "./leaderboard.service.js";
import { readValidatedQuery } from "../../middleware/validate.middleware.js";
import type { CheckUsernameQuery, UpdateProfileBody } from "./users.validation.js";

export async function me(req: Request, res: Response): Promise<void> {
  const authed = req.user;
  if (authed === undefined) {
    throw ApiError.unauthorized("Not authenticated");
  }
  const profile = await usersService.getUserProfile(authed.id);
  ApiResponse.success(res, { user: profile });
}

export async function checkUsername(req: Request, res: Response): Promise<void> {
  const query = readValidatedQuery<CheckUsernameQuery>(req);
  const excludeUserId = req.user?.id;
  const result = await usersService.checkUsernameAvailability(query.username, excludeUserId);
  ApiResponse.success(res, result);
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const authed = req.user;
  if (authed === undefined) {
    throw ApiError.unauthorized("Not authenticated");
  }
  const body = req.body as UpdateProfileBody;
  const user = await usersService.updateUserProfile(authed.id, body);
  ApiResponse.success(res, { user });
}

export async function learningInsights(req: Request, res: Response): Promise<void> {
  const authed = req.user;
  if (authed === undefined) {
    throw ApiError.unauthorized("Not authenticated");
  }
  const insights = await getLearningInsightsForUser(authed.id);
  ApiResponse.success(res, insights);
}

export async function leaderboard(req: Request, res: Response): Promise<void> {
  const authed = req.user;
  if (authed === undefined) {
    throw ApiError.unauthorized("Not authenticated");
  }
  const board = await getLeaderboard(authed.id);
  ApiResponse.success(res, board);
}
