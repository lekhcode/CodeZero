import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import type { LanguageRuntimeConfig } from "../constants/languages.js";

export type ExecutionWorkspace = {
  id: string;
  hostPath: string;
  cleanup: () => Promise<void>;
};

/** Creates a host temp directory mounted into the Docker container as /workspace. */
export async function createExecutionWorkspace(submissionId: string): Promise<ExecutionWorkspace> {
  const id = `${submissionId}-${randomUUID()}`;
  const hostPath = join(tmpdir(), "codezero-compiler", id);
  await mkdir(hostPath, { recursive: true });

  return {
    id,
    hostPath,
    cleanup: async () => {
      await rm(hostPath, { recursive: true, force: true });
    },
  };
}

export async function writeWorkspaceFiles(params: {
  workspacePath: string;
  runtime: LanguageRuntimeConfig;
  code: string;
  stdin: string;
  timeoutSec: number;
}): Promise<void> {
  const { workspacePath, runtime, code, stdin, timeoutSec } = params;
  const script = runtime.runScript.replace(/\$\{TIMEOUT_SEC\}/g, String(timeoutSec));

  await Promise.all([
    writeFile(join(workspacePath, runtime.sourceFile), code, "utf8"),
    writeFile(join(workspacePath, "input.txt"), stdin, "utf8"),
    writeFile(join(workspacePath, "run.sh"), script, { mode: 0o755 }),
    writeFile(join(workspacePath, "stdout.txt"), "", "utf8"),
    writeFile(join(workspacePath, "stderr.txt"), "", "utf8"),
    writeFile(join(workspacePath, "exitcode.txt"), "1", "utf8"),
  ]);
}
