import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import type { TemplateSlugParams } from "./scheduleTemplates.validation.js";
import * as scheduleTemplatesService from "./scheduleTemplates.service.js";
import * as previewService from "./scheduleTemplatePreview.service.js";

export async function list(_req: Request, res: Response): Promise<void> {
  const templates = await scheduleTemplatesService.listAllTemplates();
  ApiResponse.success(res, { templates });
}

export async function preview(req: Request, res: Response): Promise<void> {
  const { slug } = req.params as TemplateSlugParams;
  const preview = await previewService.getTemplatePreview(slug);
  ApiResponse.success(res, { preview });
}
