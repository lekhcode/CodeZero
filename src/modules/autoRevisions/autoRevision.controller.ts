import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import type { LogAutoRevisionBody } from "./autoRevision.validation.js";
import * as autoRevisionService from "./autoRevision.service.js";

function requireUserId(req: Request): string {
  const u = req.user;
  if (u === undefined) throw ApiError.unauthorized("Not authenticated");
  return u.id;
}

function queryTimezone(req: Request): string | undefined {
  const q = req.query["timezone"];
  return typeof q === "string" ? q : undefined;
}

export async function log(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const body = req.body as LogAutoRevisionBody;
  const result = await autoRevisionService.logAutoRevision({
    userId,
    problemId: body.problemId,
    ...(body.problemTitle !== undefined ? { problemTitle: body.problemTitle } : {}),
    ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
    ...(body.solvedAt !== undefined ? { solvedAt: body.solvedAt } : {}),
    ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
  });
  ApiResponse.success(res, result);
}

export async function today(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const grouped = await autoRevisionService.getTodayRevisions(userId, queryTimezone(req));
  ApiResponse.success(res, grouped);
}

export async function week(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const weekOffset = Number(req.query["weekOffset"] ?? 0);
  const data = await autoRevisionService.getWeekRevisions(userId, weekOffset, queryTimezone(req));
  ApiResponse.success(res, data);
}

export async function month(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const monthOffset = Number(req.query["monthOffset"] ?? 0);
  const data = await autoRevisionService.getMonthRevisions(userId, monthOffset, queryTimezone(req));
  ApiResponse.success(res, data);
}

export async function summary(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const data = await autoRevisionService.getAutoRevisionSummary(userId, queryTimezone(req));
  ApiResponse.success(res, data);
}

export async function markRevised(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const id = req.params["id"];
  if (typeof id !== "string") throw ApiError.badRequest("Invalid revision id");
  const row = await autoRevisionService.markAutoRevisionRevised(userId, id);
  ApiResponse.success(res, { revision: row });
}

export async function feed(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const status = req.query["status"];
  const period = req.query["period"];
  const topic = req.query["topic"];
  const search = req.query["search"];
  const sort = req.query["sort"];
  const data = await autoRevisionService.getRevisionFeed(userId, queryTimezone(req), {
    ...(typeof status === "string" ? { status: status as "pending" | "completed" | "all" } : {}),
    ...(typeof period === "string" ? { period: period as "all" | "today" | "week" | "month" } : {}),
    ...(typeof topic === "string" ? { topic } : {}),
    ...(typeof search === "string" ? { search } : {}),
    ...(typeof sort === "string"
      ? { sort: sort as "priority" | "due" | "title" | "difficulty" }
      : {}),
  });
  ApiResponse.success(res, data);
}

export async function history(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const page = Number(req.query["page"] ?? 1);
  const limit = Number(req.query["limit"] ?? 50);
  const from = req.query["from"];
  const to = req.query["to"];
  const date = req.query["date"];
  const data = await autoRevisionService.getRevisionHistory(userId, queryTimezone(req), {
    page,
    limit,
    ...(typeof from === "string" ? { from } : {}),
    ...(typeof to === "string" ? { to } : {}),
    ...(typeof date === "string" ? { date } : {}),
  });
  ApiResponse.success(res, data);
}

export async function activity(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const months = Number(req.query["months"] ?? 6);
  const data = await autoRevisionService.getRevisionActivity(userId, queryTimezone(req), months);
  ApiResponse.success(res, data);
}
