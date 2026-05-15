import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import * as assignmentsService from "./assignments.service.js";

export async function getToday(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (user === undefined) {
    throw ApiError.unauthorized("Not authenticated");
  }

  const result = await assignmentsService.getTodayAssignmentsForUser(user.id);
  ApiResponse.success(res, result);
}
