import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as plansService from "./plans.service.js";

export async function listBlind75(_req: Request, res: Response): Promise<void> {
  const plan = await plansService.getBlind75PlanProblems();
  ApiResponse.success(res, plan);
}

export async function listTopInterview150(_req: Request, res: Response): Promise<void> {
  const plan = await plansService.getTopInterview150PlanProblems();
  ApiResponse.success(res, plan);
}
