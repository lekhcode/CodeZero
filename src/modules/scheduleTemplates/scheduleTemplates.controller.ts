import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as scheduleTemplatesService from "./scheduleTemplates.service.js";

export async function list(_req: Request, res: Response): Promise<void> {
  const templates = await scheduleTemplatesService.listAllTemplates();
  ApiResponse.success(res, { templates });
}
