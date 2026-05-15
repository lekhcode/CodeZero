import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { JudgeMode } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import * as meta from "../services/problemJudgeMeta.service.js";
import * as judge from "../services/judgeSubmission.service.js";

export async function judgeMeta(req: Request, res: Response): Promise<void> {
  const { slug } = req.params as { slug: string };
  if (slug === undefined) throw ApiError.badRequest("Missing slug");
  const userId = req.user?.id;
  const payload = await meta.getJudgeMetaBySlug(slug, userId);
  if (payload === null) throw ApiError.notFound("Problem not found");
  ApiResponse.success(res, payload);
}

async function enqueueJudge(
  req: Request,
  res: Response,
  mode: JudgeMode,
): Promise<void> {
  const user = req.user;
  if (user === undefined) throw ApiError.unauthorized();

  const { slug } = req.params as { slug: string };
  if (slug === undefined) throw ApiError.badRequest("Missing slug");

  const body = req.body as {
    language: string;
    code: string;
    codingDurationMs?: number;
  };

  const codingDurationMs =
    mode === JudgeMode.FULL_JUDGE && typeof body.codingDurationMs === "number"
      ? body.codingDurationMs
      : undefined;

  const problem = await prisma.problem.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (problem === null) throw ApiError.notFound("Problem not found");

  await judge.assertJudgeEnabledForProblem(problem.id);

  const result = await judge.createJudgeSubmission({
    userId: user.id,
    problemId: problem.id,
    language: body.language,
    code: body.code,
    mode,
    ...(codingDurationMs !== undefined ? { codingDurationMs } : {}),
  });

  ApiResponse.created(res, result);
}

export async function judgeRun(req: Request, res: Response): Promise<void> {
  await enqueueJudge(req, res, JudgeMode.RUN_SAMPLE);
}

export async function judgeSubmit(req: Request, res: Response): Promise<void> {
  await enqueueJudge(req, res, JudgeMode.FULL_JUDGE);
}

export async function getJudgeSubmission(req: Request, res: Response): Promise<void> {
  const user = req.user;
  if (user === undefined) throw ApiError.unauthorized();
  const { id } = req.params as { id: string };
  if (id === undefined) throw ApiError.badRequest("Missing id");
  const payload = await judge.getJudgeSubmissionForUser(id, user.id);
  ApiResponse.success(res, payload);
}
