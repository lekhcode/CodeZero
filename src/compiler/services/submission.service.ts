import { SubmissionStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { SUPPORTED_LANGUAGES } from "../constants/languages.js";
import type { CompilerLanguage, CreateRunInput, SubmissionPublicView } from "../types/index.js";
import { enqueuePlaygroundSubmissionJob } from "../queue/compiler.queue.js";
import { ApiError } from "../../utils/ApiError.js";
import { compilerLogger } from "../utils/logger.js";

function toPublicView(row: {
  id: string;
  language: string;
  status: SubmissionStatus;
  stdout: string | null;
  stderr: string | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  exitCode: number | null;
  createdAt: Date;
  updatedAt: Date;
}): SubmissionPublicView {
  return {
    id: row.id,
    language: row.language,
    status: row.status,
    stdout: row.stdout,
    stderr: row.stderr,
    runtimeMs: row.runtimeMs,
    memoryKb: row.memoryKb,
    exitCode: row.exitCode,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function assertSupportedLanguage(language: string): CompilerLanguage {
  if (!(SUPPORTED_LANGUAGES as string[]).includes(language)) {
    throw ApiError.badRequest(
      `Unsupported language: ${language}. Supported: ${SUPPORTED_LANGUAGES.join(", ")}`,
    );
  }
  return language as CompilerLanguage;
}

export async function createQueuedSubmission(input: CreateRunInput): Promise<{ submissionId: string }> {
  const language = assertSupportedLanguage(input.language);
  const codeBytes = Buffer.byteLength(input.code, "utf8");
  if (codeBytes > env.COMPILER_MAX_CODE_BYTES) {
    throw ApiError.badRequest(`Code exceeds maximum size of ${env.COMPILER_MAX_CODE_BYTES} bytes`);
  }

  const submission = await prisma.compilerSubmission.create({
    data: {
      userId: input.userId ?? null,
      language,
      code: input.code,
      stdin: input.stdin ?? null,
      status: SubmissionStatus.QUEUED,
    },
    select: { id: true },
  });

  compilerLogger.info({ submissionId: submission.id, language }, "submission queued");

  await enqueuePlaygroundSubmissionJob(submission.id);

  return { submissionId: submission.id };
}

export async function getSubmissionById(id: string): Promise<SubmissionPublicView> {
  const row = await prisma.compilerSubmission.findUnique({
    where: { id },
    select: {
      id: true,
      language: true,
      status: true,
      stdout: true,
      stderr: true,
      runtimeMs: true,
      memoryKb: true,
      exitCode: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (row === null) {
    throw ApiError.notFound("Submission not found");
  }

  return toPublicView(row);
}

export async function markSubmissionRunning(submissionId: string): Promise<void> {
  await prisma.compilerSubmission.update({
    where: { id: submissionId },
    data: { status: SubmissionStatus.RUNNING },
  });
}

export async function finalizeSubmission(
  submissionId: string,
  result: {
    status: SubmissionStatus;
    stdout: string;
    stderr: string;
    exitCode: number;
    runtimeMs: number;
    memoryKb: number | null;
  },
): Promise<void> {
  await prisma.compilerSubmission.update({
    where: { id: submissionId },
    data: {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      runtimeMs: result.runtimeMs,
      memoryKb: result.memoryKb,
    },
  });
}

export async function markSubmissionInternalError(submissionId: string, message: string): Promise<void> {
  await prisma.compilerSubmission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.INTERNAL_ERROR,
      stderr: message.slice(0, 8_000),
    },
  });
}

/** Recover submissions stuck in RUNNING after worker crash. */
export async function recoverStaleRunningSubmissions(): Promise<number> {
  const cutoff = new Date(Date.now() - env.COMPILER_STALE_RUNNING_MS);
  const stale = await prisma.compilerSubmission.findMany({
    where: {
      status: SubmissionStatus.RUNNING,
      updatedAt: { lt: cutoff },
    },
    select: { id: true },
    take: 100,
  });

  if (stale.length === 0) return 0;

  await prisma.compilerSubmission.updateMany({
    where: { id: { in: stale.map((s) => s.id) } },
    data: {
      status: SubmissionStatus.INTERNAL_ERROR,
      stderr: "Execution interrupted (stale RUNNING recovered on worker startup)",
    },
  });

  compilerLogger.warn({ count: stale.length }, "recovered stale RUNNING submissions");
  return stale.length;
}

export async function loadSubmissionForExecution(submissionId: string): Promise<{
  id: string;
  language: CompilerLanguage;
  code: string;
  stdin: string;
} | null> {
  const row = await prisma.compilerSubmission.findUnique({
    where: { id: submissionId },
    select: { id: true, language: true, code: true, stdin: true, status: true },
  });

  if (row === null) return null;
  if (row.status !== SubmissionStatus.QUEUED && row.status !== SubmissionStatus.RUNNING) {
    return null;
  }

  return {
    id: row.id,
    language: assertSupportedLanguage(row.language),
    code: row.code,
    stdin: row.stdin ?? "",
  };
}
