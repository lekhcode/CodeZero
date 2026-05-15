import { JudgeMode, Prisma, SubmissionStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { assertSupportedLanguage } from "../services/submission.service.js";
import type { CompilerLanguage } from "../types/index.js";
import { enqueueJudgeSubmissionJob } from "../queue/compiler.queue.js";
import { ApiError } from "../../utils/ApiError.js";
import { compilerLogger } from "../utils/logger.js";
import { executeJudgeInDocker } from "../judge/executorJudge.js";
import { parseJudgeArgHints } from "../judge/argCodegen.js";
import type { ParsedJudgeCase } from "../judge/executorJudge.js";
import { recordSolveIfAccepted } from "./userProblemSolve.service.js";

export async function recoverStaleJudgeSubmissions(): Promise<number> {
  const cutoff = new Date(Date.now() - env.COMPILER_STALE_RUNNING_MS);
  const stale = await prisma.judgeSubmission.findMany({
    where: { status: SubmissionStatus.RUNNING, updatedAt: { lt: cutoff } },
    select: { id: true },
    take: 100,
  });
  if (stale.length === 0) return 0;
  await prisma.judgeSubmission.updateMany({
    where: { id: { in: stale.map((s) => s.id) } },
    data: {
      status: SubmissionStatus.INTERNAL_ERROR,
      stderr: "Judge interrupted (stale RUNNING)",
    },
  });
  compilerLogger.warn({ count: stale.length }, "recovered stale judge submissions");
  return stale.length;
}

export async function assertJudgeEnabledForProblem(problemId: string): Promise<void> {
  const [tc, tpl] = await Promise.all([
    prisma.problemTestcase.count({ where: { problemId, isHidden: false } }),
    prisma.problemCodeTemplate.count({ where: { problemId } }),
  ]);
  if (tpl === 0 || tc === 0) {
    throw ApiError.conflict("Judge is not configured for this problem (need templates + visible testcases)");
  }
}

export async function createJudgeSubmission(input: {
  userId: string;
  problemId: string;
  language: string;
  code: string;
  mode: JudgeMode;
  codingDurationMs?: number;
}): Promise<{ judgeSubmissionId: string }> {
  const language = assertSupportedLanguage(input.language);
  const codeBytes = Buffer.byteLength(input.code, "utf8");
  if (codeBytes > env.COMPILER_MAX_CODE_BYTES) {
    throw ApiError.badRequest(`Code exceeds maximum size of ${env.COMPILER_MAX_CODE_BYTES} bytes`);
  }

  const template = await prisma.problemCodeTemplate.findUnique({
    where: { problemId_language: { problemId: input.problemId, language } },
  });
  if (template === null) {
    throw ApiError.badRequest(`No starter template for language ${language}`);
  }

  if (language === "cpp" && parseJudgeArgHints(template.judgeArgHints) === null) {
    throw ApiError.badRequest("C++ judge requires judgeArgHints on the template (JSON array of types)");
  }

  const visibleCount = await prisma.problemTestcase.count({
    where: { problemId: input.problemId, isHidden: false },
  });
  if (visibleCount === 0) {
    throw ApiError.conflict("No visible testcases — Run is disabled");
  }

  if (input.mode === JudgeMode.FULL_JUDGE) {
    const total = await prisma.problemTestcase.count({ where: { problemId: input.problemId } });
    if (total === 0) throw ApiError.conflict("No testcases");
  }

  const row = await prisma.judgeSubmission.create({
    data: {
      userId: input.userId,
      problemId: input.problemId,
      language,
      code: input.code,
      mode: input.mode,
      status: SubmissionStatus.QUEUED,
      ...(input.mode === JudgeMode.FULL_JUDGE &&
      typeof input.codingDurationMs === "number" &&
      Number.isFinite(input.codingDurationMs)
        ? { codingDurationMs: Math.min(Math.max(0, Math.floor(input.codingDurationMs)), 1000 * 60 * 60 * 12) }
        : {}),
    },
    select: { id: true },
  });

  try {
    await enqueueJudgeSubmissionJob(row.id);
  } catch (err: unknown) {
    await prisma.judgeSubmission.delete({ where: { id: row.id } }).catch(() => {
      compilerLogger.warn({ id: row.id }, "enqueue failed; orphan judge row cleanup skipped");
    });
    const reason = err instanceof Error ? err.message : String(err);
    compilerLogger.error({ err, id: row.id }, "enqueue judge job failed");

    const devHint = env.isProduction
      ? undefined
      : ` Redis URL: ${env.REDIS_URL}. Start Redis (docker run -d -p 6379:6379 redis:7-alpine) and restart the API.`;
    throw ApiError.serviceUnavailable(
      `Judge queue is unavailable (${reason}).` + (devHint ?? " Try again shortly or contact support."),
    );
  }

  compilerLogger.info({ id: row.id, mode: input.mode, language }, "judge submission queued");
  return { judgeSubmissionId: row.id };
}

export async function markJudgeRunning(id: string): Promise<void> {
  await prisma.judgeSubmission.update({
    where: { id },
    data: { status: SubmissionStatus.RUNNING },
  });
}

export async function finalizeJudgeSubmission(
  id: string,
  data: {
    status: SubmissionStatus;
    testResults: ParsedJudgeCase[];
    stdout: string;
    stderr: string;
    runtimeMs: number;
    exitCode: number;
  },
): Promise<void> {
  await prisma.judgeSubmission.update({
    where: { id },
    data: {
      status: data.status,
      testResults: data.testResults as unknown as Prisma.InputJsonValue,
      stdout: data.stdout,
      stderr: data.stderr,
      runtimeMs: data.runtimeMs,
      exitCode: data.exitCode,
    },
  });
}

export async function markJudgeInternalError(id: string, message: string): Promise<void> {
  await prisma.judgeSubmission.update({
    where: { id },
    data: {
      status: SubmissionStatus.INTERNAL_ERROR,
      stderr: message.slice(0, 8_000),
    },
  });
}

export async function handleJudgeDeadLetter(id: string, reason: string): Promise<void> {
  await markJudgeInternalError(id, `Job failed after retries: ${reason}`.slice(0, 8_000));
}

export async function loadJudgeSubmissionForWorker(id: string): Promise<{
  id: string;
  language: CompilerLanguage;
  code: string;
  mode: JudgeMode;
  problemId: string;
  userId: string;
} | null> {
  const row = await prisma.judgeSubmission.findUnique({
    where: { id },
    select: { id: true, language: true, code: true, mode: true, problemId: true, status: true, userId: true },
  });
  if (row === null) return null;
  if (row.status !== SubmissionStatus.QUEUED && row.status !== SubmissionStatus.RUNNING) return null;
  return {
    id: row.id,
    language: assertSupportedLanguage(row.language),
    code: row.code,
    mode: row.mode,
    problemId: row.problemId,
    userId: row.userId,
  };
}

export async function processJudgeWorkerJob(judgeSubmissionId: string): Promise<void> {
  const payload = await loadJudgeSubmissionForWorker(judgeSubmissionId);
  if (payload === null) {
    compilerLogger.warn({ judgeSubmissionId }, "judge job skipped");
    return;
  }

  await markJudgeRunning(judgeSubmissionId);

  try {
    const template = await prisma.problemCodeTemplate.findUnique({
      where: { problemId_language: { problemId: payload.problemId, language: payload.language } },
    });
    if (template === null) {
      await markJudgeInternalError(judgeSubmissionId, "Template missing");
      return;
    }

    const allTests = await prisma.problemTestcase.findMany({
      where: { problemId: payload.problemId },
      orderBy: { orderIndex: "asc" },
    });

    const selected =
      payload.mode === JudgeMode.RUN_SAMPLE
        ? allTests.filter((t) => !t.isHidden)
        : allTests;

    if (selected.length === 0) {
      await markJudgeInternalError(judgeSubmissionId, "No testcases to run");
      return;
    }

    const cases = selected.map((t) => ({
      input: t.input,
      expected: t.expectedOutput,
      hidden: t.isHidden,
    }));

    const cppHints = parseJudgeArgHints(template.judgeArgHints);

    const summary = await executeJudgeInDocker({
      jobId: judgeSubmissionId,
      language: payload.language,
      userCode: payload.code,
      functionName: template.functionName,
      cases,
      cppHints: payload.language === "cpp" ? cppHints : null,
    });

    await finalizeJudgeSubmission(judgeSubmissionId, {
      status: summary.status,
      testResults: summary.testResults,
      stdout: summary.stdout,
      stderr: summary.stderr,
      runtimeMs: summary.runtimeMs,
      exitCode: summary.exitCode,
    });

    await recordSolveIfAccepted({
      judgeSubmissionId,
      userId: payload.userId,
      problemId: payload.problemId,
      mode: payload.mode,
      status: summary.status,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "judge failure";
    compilerLogger.error({ err, judgeSubmissionId }, "judge execution failed");
    await markJudgeInternalError(judgeSubmissionId, msg);
    throw err;
  }
}

export async function getJudgeSubmissionForUser(
  id: string,
  userId: string,
): Promise<{
  submission: {
    id: string;
    status: SubmissionStatus;
    mode: JudgeMode;
    language: string;
    code: string;
    codingDurationMs: number | null;
    testResults: ParsedJudgeCase[] | null;
    stdout: string | null;
    stderr: string | null;
    runtimeMs: number | null;
    exitCode: number | null;
    createdAt: string;
    updatedAt: string;
  };
}> {
  const row = await prisma.judgeSubmission.findUnique({
    where: { id },
  });
  if (row === null) throw ApiError.notFound("Submission not found");
  if (row.userId !== userId) throw ApiError.forbidden();

  let results = (row.testResults as ParsedJudgeCase[] | null) ?? null;
  if (results !== null && row.mode === JudgeMode.FULL_JUDGE) {
    results = results.map((r) => {
      if (!r.hidden) return r;
      const scrubbed: ParsedJudgeCase = {
        index: r.index,
        passed: r.passed,
        hidden: true,
      };
      if (r.error !== undefined) scrubbed.error = r.error;
      return scrubbed;
    });
  }

  return {
    submission: {
      id: row.id,
      status: row.status,
      mode: row.mode,
      language: row.language,
      code: row.code,
      codingDurationMs: row.codingDurationMs ?? null,
      testResults: results,
      stdout: row.stdout,
      stderr: row.stderr,
      runtimeMs: row.runtimeMs,
      exitCode: row.exitCode,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}
