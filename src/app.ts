import cors from "cors";
import express from "express";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { routes } from "./routes/index.js";

/**
 * Factory so tests (later) can spin up an isolated app without listening on a port.
 * Middleware order matters: CORS → request logger → body parsers → routers → 404 → error handler.
 */
export function createApp(): express.Express {
  const app = express();

  // Hide framework fingerprinting (minor hardening at the edge).
  app.disable("x-powered-by");

  app.use(
    cors({
      // If unset, reflect the request `Origin` (handy for local dev). In prod, prefer an allowlist.
      origin: env.CORS_ORIGINS.length > 0 ? env.CORS_ORIGINS : true,
      credentials: false,
    }),
  );

  // One line per request in dev (pino-pretty); JSON in prod — latency-friendly.
  app.use(
    pinoHttp({
      logger,
      autoLogging: true,
    }),
  );

  // Cap JSON payload size early — protects against accidental huge bodies / abuse.
  app.use(express.json({ limit: "1mb" }));

  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
