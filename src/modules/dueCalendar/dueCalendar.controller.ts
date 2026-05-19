import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { readValidatedQuery } from "../../middleware/validate.middleware.js";
import type { DueCalendarDayQuery, DueCalendarSummaryQuery } from "./dueCalendar.validation.js";
import * as dueCalendarService from "./dueCalendar.service.js";

function requireUserId(req: Request): string {
  const u = req.user;
  if (u === undefined) throw ApiError.unauthorized("Not authenticated");
  return u.id;
}

export async function getSummary(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const query = readValidatedQuery<DueCalendarSummaryQuery>(req);
  const result = await dueCalendarService.getDueCalendarSummary(userId, query.from, query.to);
  ApiResponse.success(res, result);
}

export async function getDay(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const query = readValidatedQuery<DueCalendarDayQuery>(req);
  const result = await dueCalendarService.getDueCalendarDay(userId, query.date);
  ApiResponse.success(res, result);
}
