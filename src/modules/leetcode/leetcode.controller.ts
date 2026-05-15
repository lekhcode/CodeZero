import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import type { ProblemSlugParams } from "./leetcode.validation.js";
import * as leetcodeService from "./leetcode.service.js";

export async function getDailyProblem(_req: Request, res: Response): Promise<void> {
  const problem = await leetcodeService.getTodayDailyProblem();
  ApiResponse.success(res, problem);
}

export async function getProblemBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = req.params as unknown as ProblemSlugParams;
  const problem = await leetcodeService.getProblemBySlug(slug);
  ApiResponse.success(res, problem);
}
