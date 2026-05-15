import { env } from "../../config/env.js";

/**
 * Hardened `docker run` flags — user code never runs on the API/worker Node process.
 * Network disabled; memory/CPU/pids capped; container auto-removed after run.
 */
export function buildSecureDockerRunArgs(workspaceHostPath: string): string[] {
  return [
    "run",
    "--rm",
    "--network",
    "none",
    "--memory",
    env.COMPILER_DOCKER_MEMORY,
    "--cpus",
    env.COMPILER_DOCKER_CPUS,
    "--pids-limit",
    String(env.COMPILER_DOCKER_PIDS_LIMIT),
    "--read-only",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=32m",
    "-v",
    `${workspaceHostPath}:/workspace:rw`,
    "-w",
    "/workspace",
  ];
}
