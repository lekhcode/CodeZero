import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { readValidatedQuery } from "../../middleware/validate.middleware.js";
import type {
  ActivityQuery,
  ListSubmissionsQuery,
  SubmissionIdParams,
} from "./submissions.validation.js";
import * as submissionsService from "./submissions.service.js";
import { getSubmissionActivityForUser } from "./submissionActivity.service.js";

function requireUserId(req: Request): string {
  const u = req.user;
  if (u === undefined) throw ApiError.unauthorized("Not authenticated");
  return u.id;
}

export async function getActivity(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const query = readValidatedQuery<ActivityQuery>(req);
  const result = await getSubmissionActivityForUser(
    userId,
    query.year === undefined
      ? { rolling: true }
      : { rolling: false, year: query.year },
  );
  ApiResponse.success(res, result);
}

export async function getSolvedStats(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const stats = await submissionsService.getSolvedDifficultyStatsForUser(userId);
  ApiResponse.success(res, stats);
}

export async function list(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const query = readValidatedQuery<ListSubmissionsQuery>(req);
  const result = await submissionsService.listSubmissionsForUser(userId, query);
  ApiResponse.success(res, result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as unknown as SubmissionIdParams;
  const result = await submissionsService.getSubmissionForUser(userId, id);
  ApiResponse.success(res, result);
}
