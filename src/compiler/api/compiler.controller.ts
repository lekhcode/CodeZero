import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as submissionService from "../services/submission.service.js";

/**
 * Async submission API — never blocks on Docker execution.
 * Flow: validate → persist QUEUED → enqueue BullMQ → return id immediately.
 */
export async function getSubmission(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const submission = await submissionService.getSubmissionById(id);
  ApiResponse.success(res, { submission });
}
