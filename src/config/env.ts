/**
 * Central place for environment variables we actually use.
 * Validates required keys early so the process fails fast instead of mid-request.
 */
import "./loadEnv.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env["NODE_ENV"] ?? "development";
const isProduction = nodeEnv === "production";

/** Parsed port; defaults to 3000 for local dev */
const portRaw = process.env["PORT"];
const port = portRaw === undefined || portRaw === "" ? 3000 : Number(portRaw);
if (!Number.isFinite(port) || port <= 0) {
  throw new Error(`Invalid PORT: ${portRaw}`);
}

/**
 * CORS: optional comma-separated allowlist.
 * In development, leaving this unset is convenient (browser + API on different ports).
 * In production, set explicit origins.
 */
const corsOriginsRaw = process.env["CORS_ORIGIN"];
const corsOrigins =
  corsOriginsRaw === undefined || corsOriginsRaw === ""
    ? []
    : corsOriginsRaw.split(",").map((s) => s.trim()).filter(Boolean);

/**
 * JWT signing secret. Must be long and random in production (e.g. `openssl rand -base64 32`).
 * Day 2 uses access tokens only — no refresh rotation — so compromise of this secret invalidates all sessions.
 * Always a string (from env); set in `.env` as a quoted string if you prefer.
 */
const jwtSecret: string = requireEnv("JWT_SECRET");

/**
 * `jsonwebtoken` `expiresIn` string (e.g. `"7d"`, `"24h"`, `"3600"`). Defaults for local dev convenience.
 * Always normalized to string — set `JWT_EXPIRES_IN` in `.env` as a string literal.
 */
const jwtExpiresInRaw = process.env["JWT_EXPIRES_IN"];
const jwtExpiresInTrimmed =
  jwtExpiresInRaw === undefined ? "" : String(jwtExpiresInRaw).trim();
const jwtExpiresIn: string =
  jwtExpiresInTrimmed === "" ? "7d" : jwtExpiresInTrimmed;

const redisUrlRaw = process.env["REDIS_URL"];
const redisUrl =
  redisUrlRaw === undefined || redisUrlRaw === ""
    ? "redis://127.0.0.1:6379"
    : redisUrlRaw;

function parsePositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid ${name}: ${raw}`);
  }
  return Math.floor(n);
}

export const env = {
  NODE_ENV: nodeEnv,
  isProduction,
  PORT: port,
  /** Required once you run migrations / hit the DB */
  DATABASE_URL: requireEnv("DATABASE_URL"),
  CORS_ORIGINS: corsOrigins,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: jwtExpiresIn,
  /** BullMQ + compiler workers (isolated execution domain) */
  REDIS_URL: redisUrl,
  COMPILER_QUEUE_NAME: process.env["COMPILER_QUEUE_NAME"] ?? "compiler-execution",
  COMPILER_JOB_ATTEMPTS: parsePositiveInt("COMPILER_JOB_ATTEMPTS", 3),
  COMPILER_JOB_TIMEOUT_MS: parsePositiveInt("COMPILER_JOB_TIMEOUT_MS", 30_000),
  COMPILER_EXECUTION_TIMEOUT_SEC: parsePositiveInt("COMPILER_EXECUTION_TIMEOUT_SEC", 10),
  COMPILER_DOCKER_MEMORY: process.env["COMPILER_DOCKER_MEMORY"] ?? "256m",
  COMPILER_DOCKER_CPUS: process.env["COMPILER_DOCKER_CPUS"] ?? "0.5",
  COMPILER_DOCKER_PIDS_LIMIT: parsePositiveInt("COMPILER_DOCKER_PIDS_LIMIT", 64),
  COMPILER_MAX_CODE_BYTES: parsePositiveInt("COMPILER_MAX_CODE_BYTES", 65_536),
  COMPILER_STALE_RUNNING_MS: parsePositiveInt("COMPILER_STALE_RUNNING_MS", 600_000),
} as const;
