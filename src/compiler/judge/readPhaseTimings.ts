import { readFile } from "node:fs/promises";
import { join } from "node:path";

export type HarnessMetrics = {
  executionTimeMs?: number;
};

export type PhaseTimings = {
  compileTimeMs: number;
  executionTimeMs: number;
};

function parsePositiveInt(raw: string): number | null {
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function readCompileMs(workspacePath: string): Promise<number> {
  try {
    const raw = await readFile(join(workspacePath, "compile_ms.txt"), "utf8");
    return parsePositiveInt(raw) ?? 0;
  } catch {
    return 0;
  }
}

export function parseHarnessMetrics(stdout: string): HarnessMetrics {
  try {
    const parsed = JSON.parse(stdout.trim()) as {
      executionTimeMs?: number;
      results?: unknown[];
    };
    if (typeof parsed.executionTimeMs === "number" && parsed.executionTimeMs >= 0) {
      return { executionTimeMs: Math.floor(parsed.executionTimeMs) };
    }
    return {};
  } catch {
    return {};
  }
}

export async function readPhaseTimings(
  workspacePath: string,
  stdout: string,
): Promise<PhaseTimings> {
  const compileTimeMs = await readCompileMs(workspacePath);
  const metrics = parseHarnessMetrics(stdout);
  return {
    compileTimeMs,
    executionTimeMs: metrics.executionTimeMs ?? 0,
  };
}
