/**
 * Central application logger (Pino).
 *
 * - Production: JSON to stdout (log aggregators / Datadog / CloudWatch friendly, very low overhead).
 * - Development: `pino-pretty` for human-readable lines (requires devDependencies).
 *
 * Use `req.log` from `pino-http` in routes when you need per-request context later (requestId, userId).
 */
import "./loadEnv.js";
import pino from "pino";
import type { LevelWithSilent, Logger } from "pino";
import { env } from "./env.js";

const levelOrder: readonly LevelWithSilent[] = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
];

function resolveLevel(): LevelWithSilent {
  const raw = process.env["LOG_LEVEL"];
  if (raw !== undefined && raw !== "" && levelOrder.includes(raw as LevelWithSilent)) {
    return raw as LevelWithSilent;
  }
  return env.isProduction ? "info" : "debug";
}

function createLogger(): Logger {
  const level = resolveLevel();

  if (env.isProduction) {
    return pino({
      level,
      /* Redact common secret fields if they ever appear on logged objects */
      redact: {
        paths: ["req.headers.authorization", "password", "req.body.password"],
        remove: true,
      },
    });
  }

  return pino({
    level,
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        singleLine: true,
        translateTime: "SYS:HH:MM:ss",
      },
    },
  });
}

export const logger = createLogger();
