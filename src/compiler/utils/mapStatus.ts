import { SubmissionStatus } from "@prisma/client";
import type { SandboxExecutionResult } from "../types/index.js";

export function mapExitToStatus(params: {
  exitCode: number;
  timedOut: boolean;
  needsCompile: boolean;
}): SubmissionStatus {
  if (params.timedOut) {
    return SubmissionStatus.TIME_LIMIT_EXCEEDED;
  }
  if (params.exitCode === 124 || params.exitCode === 137) {
    return SubmissionStatus.TIME_LIMIT_EXCEEDED;
  }
  if (params.needsCompile && params.exitCode === 2) {
    return SubmissionStatus.COMPILATION_ERROR;
  }
  if (params.exitCode === 0) {
    return SubmissionStatus.ACCEPTED;
  }
  return SubmissionStatus.RUNTIME_ERROR;
}

export function buildExecutionResult(params: {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtimeMs: number;
  memoryKb: number | null;
  timedOut: boolean;
  needsCompile: boolean;
}): SandboxExecutionResult {
  const status = mapExitToStatus({
    exitCode: params.exitCode,
    timedOut: params.timedOut,
    needsCompile: params.needsCompile,
  });
  return {
    stdout: params.stdout,
    stderr: params.stderr,
    exitCode: params.exitCode,
    runtimeMs: params.runtimeMs,
    memoryKb: params.memoryKb,
    status,
    timedOut: params.timedOut,
  };
}
