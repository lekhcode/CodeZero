import type { Request, Response } from "express";
import { readValidatedQuery } from "../../middleware/validate.middleware.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as catalogService from "./leetcode.catalog.service.js";
import type { CatalogMetaQuery, ListProblemsQuery } from "./leetcode.catalog.validation.js";
import type { ProblemSlugParams } from "./leetcode.validation.js";
import * as leetcodeService from "./leetcode.service.js";

export async function listProblems(req: Request, res: Response): Promise<void> {
  const query = readValidatedQuery<ListProblemsQuery>(req);
  const page = await catalogService.listProblemCatalog(query);
  ApiResponse.success(res, page);
}

export async function getCatalogStats(req: Request, res: Response): Promise<void> {
  const { includePremium } = readValidatedQuery<CatalogMetaQuery>(req);
  const stats = await catalogService.getCatalogStats(includePremium);
  ApiResponse.success(res, stats);
}

export async function listProblemTopics(req: Request, res: Response): Promise<void> {
  const { includePremium } = readValidatedQuery<CatalogMetaQuery>(req);
  const topicTags = await catalogService.listProblemTopicsWithCounts(includePremium);
  ApiResponse.success(res, { topicTags });
}

export async function getDailyProblem(_req: Request, res: Response): Promise<void> {
  const problem = await leetcodeService.getTodayDailyProblem();
  ApiResponse.success(res, problem);
}

export async function getProblemBySlug(req: Request, res: Response): Promise<void> {
  const { slug } = req.params as unknown as ProblemSlugParams;
  const problem = await leetcodeService.getProblemBySlug(slug);
  ApiResponse.success(res, problem);
}
