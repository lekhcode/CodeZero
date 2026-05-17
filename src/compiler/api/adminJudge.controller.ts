import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

export async function addTemplate(req: Request, res: Response): Promise<void> {
  const { problemId } = req.params as { problemId: string };
  if (problemId === undefined) throw ApiError.badRequest("Missing problem id");
  const body = req.body as {
    language: string;
    starterCode: string;
    functionName: string;
    judgeArgHints?: string | null;
  };

  const p = await prisma.problem.findUnique({ where: { id: problemId } });
  if (p === null) throw ApiError.notFound("Problem not found");

  const row = await prisma.problemCodeTemplate.upsert({
    where: { problemId_language: { problemId, language: body.language } },
    create: {
      problemId,
      language: body.language,
      starterCode: body.starterCode,
      functionName: body.functionName,
      judgeArgHints: body.judgeArgHints ?? null,
    },
    update: {
      starterCode: body.starterCode,
      functionName: body.functionName,
      judgeArgHints: body.judgeArgHints ?? null,
    },
  });

  ApiResponse.created(res, { template: row });
}

export async function addTestcase(req: Request, res: Response): Promise<void> {
  const { problemId } = req.params as { problemId: string };
  if (problemId === undefined) throw ApiError.badRequest("Missing problem id");
  const body = req.body as {
    mode: "single" | "batch";
    items: Array<{
      input: string;
      expectedOutput: string;
      isHidden: boolean;
      orderIndex: number;
    }>;
  };

  const p = await prisma.problem.findUnique({ where: { id: problemId } });
  if (p === null) throw ApiError.notFound("Problem not found");

  const rows = await prisma.problemTestcase.createManyAndReturn({
    data: body.items.map((item) => ({
      problemId,
      input: item.input,
      expectedOutput: item.expectedOutput,
      isHidden: item.isHidden,
      orderIndex: item.orderIndex,
    })),
  });

  if (body.mode === "single") {
    ApiResponse.created(res, { testcase: rows[0] });
    return;
  }

  ApiResponse.created(res, { testcases: rows });
}
