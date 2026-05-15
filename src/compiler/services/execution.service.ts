import { executeInDockerSandbox } from "../sandbox/executor.js";
import {
  finalizeSubmission,
  loadSubmissionForExecution,
  markSubmissionInternalError,
  markSubmissionRunning,
} from "./submission.service.js";
import { compilerLogger } from "../utils/logger.js";

/**
 * Worker-side execution pipeline — isolated from Express request handlers.
 */
export async function processSubmissionJob(submissionId: string): Promise<void> {
  const payload = await loadSubmissionForExecution(submissionId);
  if (payload === null) {
    compilerLogger.warn({ submissionId }, "submission skipped (missing or already terminal)");
    return;
  }

  await markSubmissionRunning(submissionId);

  try {
    const result = await executeInDockerSandbox({
      submissionId: payload.id,
      language: payload.language,
      code: payload.code,
      stdin: payload.stdin,
    });

    await finalizeSubmission(submissionId, {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      runtimeMs: result.runtimeMs,
      memoryKb: result.memoryKb,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown execution error";
    compilerLogger.error({ err, submissionId }, "execution failed");
    await markSubmissionInternalError(submissionId, message);
    throw err;
  }
}

export async function handleDeadLetter(submissionId: string, reason: string): Promise<void> {
  await markSubmissionInternalError(
    submissionId,
    `Job failed after retries: ${reason}`.slice(0, 8_000),
  );
}
