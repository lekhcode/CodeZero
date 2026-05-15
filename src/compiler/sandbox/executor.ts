import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { env } from "../../config/env.js";
import { LANGUAGE_RUNTIMES } from "../constants/languages.js";
import type { CompilerLanguage, SandboxExecutionResult } from "../types/index.js";
import { buildExecutionResult } from "../utils/mapStatus.js";
import { truncateOutput } from "../utils/truncate.js";
import { buildSecureDockerRunArgs } from "../docker/dockerArgs.js";
import { createExecutionWorkspace, writeWorkspaceFiles } from "./workspace.js";
import { compilerLogger } from "../utils/logger.js";

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

/**
 * Full sandbox lifecycle: workspace → Docker (compile+run) → capture outputs → cleanup.
 * NEVER executes user code via Node `eval` / `vm` — only inside Docker.
 */
export async function executeInDockerSandbox(params: {
  submissionId: string;
  language: CompilerLanguage;
  code: string;
  stdin: string;
}): Promise<SandboxExecutionResult> {
  const runtime = LANGUAGE_RUNTIMES[params.language];
  const workspace = await createExecutionWorkspace(params.submissionId);
  const started = Date.now();
  const dockerTimeoutMs = env.COMPILER_JOB_TIMEOUT_MS + 5_000;

  compilerLogger.info(
    { submissionId: params.submissionId, language: params.language, image: runtime.dockerImage },
    "sandbox execution starting",
  );

  try {
    await writeWorkspaceFiles({
      workspacePath: workspace.hostPath,
      runtime,
      code: params.code,
      stdin: params.stdin,
      timeoutSec: env.COMPILER_EXECUTION_TIMEOUT_SEC,
    });

    const dockerArgs = [
      ...buildSecureDockerRunArgs(workspace.hostPath),
      runtime.dockerImage,
      "sh",
      "/workspace/run.sh",
    ];

    const { timedOut: dockerTimedOut, dockerStderr, exitCode: dockerExit } = await runDockerCommand(
      dockerArgs,
      dockerTimeoutMs,
    );
    const outputs = await readWorkspaceOutputs(workspace.hostPath);
    if (dockerExit !== 0 && dockerStderr.trim() !== "" && outputs.stderr.trim() === "") {
      outputs.stderr = dockerStderr;
    }
    const runtimeMs = Date.now() - started;

    const programTimedOut =
      dockerTimedOut ||
      outputs.exitCode === 124 ||
      outputs.exitCode === 137;

    const result = buildExecutionResult({
      stdout: truncateOutput(outputs.stdout),
      stderr: truncateOutput(outputs.stderr),
      exitCode: programTimedOut ? 124 : outputs.exitCode,
      runtimeMs,
      memoryKb: null,
      timedOut: programTimedOut,
      needsCompile: runtime.needsCompile,
    });

    compilerLogger.info(
      {
        submissionId: params.submissionId,
        status: result.status,
        runtimeMs: result.runtimeMs,
        exitCode: result.exitCode,
      },
      "sandbox execution finished",
    );

    return result;
  } finally {
    await workspace.cleanup().catch((err: unknown) => {
      compilerLogger.warn({ err, submissionId: params.submissionId }, "workspace cleanup failed");
    });
  }
}
