/**
 * Standalone worker process — run via `npm run compiler:worker`.
 * NEVER mount this inside the Express API server (isolation + horizontal scaling).
 */
import "../../config/loadEnv.js";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { startCompilerWorker, stopCompilerWorker } from "./compiler.worker.js";

async function main(): Promise<void> {
  await startCompilerWorker();
  logger.info("compiler worker bootstrap complete");
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "compiler worker shutdown");
  await stopCompilerWorker();
  await prisma.$disconnect();
  process.exit(0);
}

void main().catch((err: unknown) => {
  logger.error({ err }, "compiler worker failed to start");
  process.exit(1);
});

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});
process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
