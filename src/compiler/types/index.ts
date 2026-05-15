import type { SubmissionStatus } from "@prisma/client";

/** Supported language keys (API + worker). */
export type CompilerLanguage = "javascript" | "python" | "cpp" | "java";

export type CompilerJobPayload =
  | { kind: "playground"; submissionId: string }
  | { kind: "judge"; judgeSubmissionId: string };

/** Legacy jobs enqueued without `kind` (pre-discriminated union). */
export type CompilerJobLegacyPayload =
  | { submissionId?: string | undefined }
  | { judgeSubmissionId?: string | undefined };

export type SandboxExecutionResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
  /** Best-effort; not all runtimes report memory inside Docker. */
  memoryKb: number | null;
  status: SubmissionStatus;
  timedOut: boolean;
};

export type SubmissionPublicView = {
  id: string;
  language: string;
  status: SubmissionStatus;
  stdout: string | null;
  stderr: string | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  exitCode: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateRunInput = {
  language: CompilerLanguage;
  code: string;
  stdin?: string | undefined;
  userId?: string | undefined;
};
