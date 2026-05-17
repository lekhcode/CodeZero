import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { readValidatedQuery } from "../../middleware/validate.middleware.js";
import type { AssignmentHistoryQuery } from "./userAssignments.validation.js";
import * as assignmentTracking from "./assignmentTracking.service.js";

function requireUserId(req: Request): string {
  const u = req.user;
  if (u === undefined) throw ApiError.unauthorized("Not authenticated");
  return u.id;
}

export async function getToday(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const result = await assignmentTracking.getTrackedTodayAssignments(userId);
  ApiResponse.success(res, result);
}

export async function getDue(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const result = await assignmentTracking.getDueAssignments(userId);
  ApiResponse.success(res, result);
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const query = readValidatedQuery<AssignmentHistoryQuery>(req);
  const result = await assignmentTracking.getAssignmentHistory(userId, query);
  ApiResponse.success(res, result);
}
