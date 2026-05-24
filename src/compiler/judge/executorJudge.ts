import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { env } from "../../config/env.js";
import type { CompilerLanguage } from "../types/index.js";
import { buildSecureDockerRunArgs } from "../docker/dockerArgs.js";
import { createExecutionWorkspace } from "../sandbox/workspace.js";
import { compilerLogger } from "../utils/logger.js";
import { truncateOutput } from "../utils/truncate.js";
import { normalizeJudgeHarnessResults, relaxJudgeTestResults } from "./judgeOutputCompare.js";
import { materializeJudgeWorkspace, type JudgeCasePayload } from "./writeJudgeWorkspace.js";
import type { ArgHintRow } from "./argCodegen.js";
import { readPhaseTimings } from "./readPhaseTimings.js";
import { SubmissionStatus } from "@prisma/client";

const DOCKER_BIN = process.env["DOCKER_BIN"] ?? "docker";

function runDockerCommand(
  args: string[],
  timeoutMs: number,
): Promise<{ exitCode: number; timedOut: boolean; dockerStderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(DOCKER_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });
    let timedOut = false;
    let dockerStderr = "";
    child.stderr?.on("data", (chunk: Buffer) => {
      dockerStderr += chunk.toString("utf8");
    });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code ?? 1, timedOut, dockerStderr });
    });
  });
}

async function readWorkspaceOutputs(workspacePath: string): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  const [stdout, stderr, exitRaw] = await Promise.all([
    readFile(join(workspacePath, "stdout.txt"), "utf8").catch(() => ""),
    readFile(join(workspacePath, "stderr.txt"), "utf8").catch(() => ""),
    readFile(join(workspacePath, "exitcode.txt"), "utf8").catch(() => "1"),
  ]);
  const parsed = Number.parseInt(exitRaw.trim(), 10);
  return {
    stdout,
    stderr,
    exitCode: Number.isFinite(parsed) ? parsed : 1,
  };
}

export type ParsedJudgeCase = {
  index: number;
  passed: boolean;
  hidden?: boolean;
  runTimeMs?: number;
  actual?: string;
  expected?: string;
  inputPreview?: string;
  error?: string;
};

export type JudgeExecutionSummary = {
  status: SubmissionStatus;
  testResults: ParsedJudgeCase[];
  stdout: string;
  stderr: string;
  /** Max per-testcase harness time (user code only). */
  runtimeMs: number;
  executionTimeMs: number;
  compileTimeMs: number;
  sandboxWallMs: number;
  workspaceMs: number;
  exitCode: number;
};

function aggregateVerdict(
  results: ParsedJudgeCase[],
  exitCode: number,
  timedOut: boolean,
  harnessStderr: string,
  language: CompilerLanguage,
): SubmissionStatus {
  if (timedOut || exitCode === 124 || exitCode === 137) {
    return SubmissionStatus.TIME_LIMIT_EXCEEDED;
  }
  if (exitCode === 2) {
    return SubmissionStatus.COMPILATION_ERROR;
  }
  if (exitCode !== 0 && harnessStderr.trim() !== "") {
    return SubmissionStatus.INTERNAL_ERROR;
  }
  if (results.length === 0) {
    return SubmissionStatus.RUNTIME_ERROR;
  }
  for (const r of results) {
    if (r.error !== undefined && r.error !== "") {
      return SubmissionStatus.RUNTIME_ERROR;
    }
  }
  for (const r of results) {
    if (!r.passed) {
      return SubmissionStatus.WRONG_ANSWER;
    }
  }
  void language;
  return SubmissionStatus.ACCEPTED;
}

export async function executeJudgeInDocker(params: {
  jobId: string;
  language: CompilerLanguage;
  userCode: string;
  functionName: string;
  cases: JudgeCasePayload[];
  cppHints: ArgHintRow | null;
}): Promise<JudgeExecutionSummary> {
  const workspace = await createExecutionWorkspace(params.jobId);
  const dockerTimeoutMs = env.COMPILER_JOB_TIMEOUT_MS + 5_000;

  try {
    const workspaceStart = Date.now();
    const { dockerImage } = await materializeJudgeWorkspace({
      workspacePath: workspace.hostPath,
      language: params.language,
      userCode: params.userCode,
      functionName: params.functionName,
      cases: params.cases,
      cppHints: params.cppHints,
      timeoutSec: env.COMPILER_EXECUTION_TIMEOUT_SEC,
    });
    const workspaceMs = Date.now() - workspaceStart;

    compilerLogger.info(
      { jobId: params.jobId, language: params.language, image: dockerImage, workspaceMs },
      "judge sandbox start",
    );

    const dockerArgs = [
      ...buildSecureDockerRunArgs(workspace.hostPath),
      dockerImage,
      "sh",
      "/workspace/run.sh",
    ];

    const dockerStart = Date.now();
    const { timedOut: dockerTimedOut, dockerStderr, exitCode: dockerExit } = await runDockerCommand(
      dockerArgs,
      dockerTimeoutMs,
    );
    const sandboxWallMs = Date.now() - dockerStart;

    const outputs = await readWorkspaceOutputs(workspace.hostPath);
    if (dockerExit !== 0 && dockerStderr.trim() !== "" && outputs.stderr.trim() === "") {
      outputs.stderr = dockerStderr;
    }

    const programTimedOut =
      dockerTimedOut || outputs.exitCode === 124 || outputs.exitCode === 137;

    let results: ParsedJudgeCase[] = [];
    try {
      const parsed = JSON.parse(outputs.stdout.trim()) as {
        results?: ParsedJudgeCase[];
      };
      if (Array.isArray(parsed.results)) {
        results = parsed.results;
      }
    } catch {
      results = [];
    }

    results = normalizeJudgeHarnessResults(results, params.cases);
    results = relaxJudgeTestResults(results, params.cases);

    const phases = await readPhaseTimings(workspace.hostPath, outputs.stdout);
    const executionTimeMs = phases.executionTimeMs;

    const exitForStatus = programTimedOut ? 124 : outputs.exitCode;
    const status = aggregateVerdict(
      results,
      exitForStatus,
      programTimedOut,
      outputs.stderr,
      params.language,
    );

    compilerLogger.info(
      {
        jobId: params.jobId,
        language: params.language,
        status,
        workspaceMs,
        sandboxWallMs,
        compileTimeMs: phases.compileTimeMs,
        executionTimeMs,
        caseCount: params.cases.length,
      },
      "judge sandbox phases",
    );

    return {
      status,
      testResults: results,
      stdout: truncateOutput(outputs.stdout),
      stderr: truncateOutput(outputs.stderr),
      runtimeMs: executionTimeMs,
      executionTimeMs,
      compileTimeMs: phases.compileTimeMs,
      sandboxWallMs,
      workspaceMs,
      exitCode: exitForStatus,
    };
  } finally {
    await workspace.cleanup().catch((err: unknown) => {
      compilerLogger.warn({ err, jobId: params.jobId }, "judge workspace cleanup failed");
    });
  }
}
