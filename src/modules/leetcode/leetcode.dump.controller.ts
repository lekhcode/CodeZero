import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as dumpService from "./leetcode.dump.service.js";
import type { DumpCatalogBody, DumpDetailsBody } from "./leetcode.dump.validation.js";

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
