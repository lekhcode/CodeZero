/**
 * Process entrypoint: load config, bind HTTP, register graceful shutdown hooks.
 * Keep this file small — business logic belongs in modules/services.
 */
import "./config/loadEnv.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./config/prisma.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "HTTP server listening");
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "shutdown requested");

  await new Promise<void>((resolve) => {
    server.close(() => {
      resolve();
    });
  });

  await prisma.$disconnect();
  process.exit(0);
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});
process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
