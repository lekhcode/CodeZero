import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as dumpService from "./leetcode.dump.service.js";
import * as studyPlanDumpService from "./leetcode.studyPlan.dump.service.js";
import type {
  DumpCatalogBody,
  DumpDetailsBody,
  DumpNeetCode150Body,
} from "./leetcode.dump.validation.js";

export async function dumpCatalog(req: Request, res: Response): Promise<void> {
  const body = req.body as DumpCatalogBody;
  const result = await dumpService.dumpCatalog(body);
  ApiResponse.success(res, result);
}

export async function dumpDetails(req: Request, res: Response): Promise<void> {
  const body = req.body as DumpDetailsBody;
  const result = await dumpService.dumpDetails(body);
  ApiResponse.success(res, result);
}

export async function dumpNeetCode150(req: Request, res: Response): Promise<void> {
  const body = req.body as DumpNeetCode150Body;
  const result = await studyPlanDumpService.dumpNeetCode150(body);
  ApiResponse.success(res, result);
}
