import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import type { CreateUserScheduleBody, UserScheduleIdParams } from "./userSchedules.validation.js";
import * as userSchedulesService from "./userSchedules.service.js";

function requireUserId(req: Request): string {
  const u = req.user;
  if (u === undefined) {
    throw ApiError.unauthorized("Not authenticated");
  }
  return u.id;
}

export async function list(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const schedules = await userSchedulesService.listForUser(userId);
  ApiResponse.success(res, { schedules });
}

export async function create(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const body = req.body as CreateUserScheduleBody;
  const schedule = await userSchedulesService.createForUser(userId, body);
  ApiResponse.created(res, { schedule });
}

export async function toggle(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as unknown as UserScheduleIdParams;
  const result = await userSchedulesService.toggleActive(userId, id);
  ApiResponse.success(res, result);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const { id } = req.params as unknown as UserScheduleIdParams;
  await userSchedulesService.removeForUser(userId, id);
  ApiResponse.success(res, { id, deleted: true });
}
