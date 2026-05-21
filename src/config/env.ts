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
 * CORS allowlist: `CORS_ORIGIN` (comma-separated) + `FRONTEND_URL` + common Vite dev origins.
 */
const corsOriginsRaw = process.env["CORS_ORIGIN"];
const frontendUrl = (process.env["FRONTEND_URL"] ?? "http://localhost:5173").replace(/\/$/, "");

function buildCorsAllowlist(): string[] {
  const fromEnv =
    corsOriginsRaw === undefined || corsOriginsRaw === ""
      ? []
      : corsOriginsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const set = new Set<string>([...fromEnv, frontendUrl]);
  if (!isProduction) {
    for (const port of [5173, 4173, 3000]) {
      set.add(`http://localhost:${port}`);
      set.add(`http://127.0.0.1:${port}`);
    }
  }
  return [...set];
}

const corsAllowlist = buildCorsAllowlist();

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

function parseBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  throw new Error(`Invalid ${name}: ${raw} (use true/false)`);
}

export const env = {
  NODE_ENV: nodeEnv,
  isProduction,
  PORT: port,
  /** Required once you run migrations / hit the DB */
  DATABASE_URL: requireEnv("DATABASE_URL"),
  /** Origins allowed for browser cross-origin API calls */
  CORS_ALLOWLIST: corsAllowlist,
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
  /**
   * Optional secret for `POST /api/v1/leetcode/dump/*` (header `x-leetcode-dump-token`).
   * When unset, dump routes require a normal JWT (`Authorization: Bearer …`).
   */
  LEETCODE_DUMP_TOKEN: (process.env["LEETCODE_DUMP_TOKEN"] ?? "").trim(),
  /** Default delay between LeetCode detail fetches during dump (ms). */
  LEETCODE_DUMP_DELAY_MS: parsePositiveInt("LEETCODE_DUMP_DELAY_MS", 350),
  /** OAuth — optional until social login is enabled */
  GOOGLE_CLIENT_ID: (process.env["GOOGLE_CLIENT_ID"] ?? "").trim(),
  GITHUB_CLIENT_ID: (process.env["GITHUB_CLIENT_ID"] ?? "").trim(),
  GITHUB_CLIENT_SECRET: (process.env["GITHUB_CLIENT_SECRET"] ?? "").trim(),
  /** Browser origin for OAuth redirects (no trailing slash) */
  FRONTEND_URL: frontendUrl,
  /**
   * Daily LeetCode POTD sync cron (same logic as GET /api/v1/daily-problem).
   * Enabled by default in production; off in development unless explicitly set.
   */
  DAILY_POTD_CRON_ENABLED: parseBoolean("DAILY_POTD_CRON_ENABLED", isProduction),
  DAILY_POTD_CRON: {
    /** Default: 06:00 every day */
    expression: (process.env["DAILY_POTD_CRON_EXPRESSION"] ?? "0 6 * * *").trim(),
    timezone: (process.env["DAILY_POTD_CRON_TIMEZONE"] ?? "Asia/Kolkata").trim(),
  },
  /** Resend API key — when set, OTP emails are sent unless EMAIL_OTP_LOG_CONSOLE=true */
  RESEND_API_KEY: (process.env["RESEND_API_KEY"] ?? "").trim(),
  EMAIL_FROM: (process.env["EMAIL_FROM"] ?? "CodeZero <onboarding@resend.dev>").trim(),
  OTP_EXPIRY_MINUTES: parsePositiveInt("OTP_EXPIRY_MINUTES", 10),
  OTP_MAX_ATTEMPTS: parsePositiveInt("OTP_MAX_ATTEMPTS", 5),
  OTP_RESEND_COOLDOWN_SEC: parsePositiveInt("OTP_RESEND_COOLDOWN_SEC", 60),
  OTP_RATE_LIMIT_PER_HOUR: parsePositiveInt("OTP_RATE_LIMIT_PER_HOUR", 8),
  /**
   * When true, OTP codes are logged to the server console instead of sending via Resend.
   * Defaults to true in dev only when RESEND_API_KEY is unset; false when the key is present.
   */
  EMAIL_OTP_LOG_CONSOLE: parseBoolean(
    "EMAIL_OTP_LOG_CONSOLE",
    !isProduction && (process.env["RESEND_API_KEY"] ?? "").trim() === "",
  ),
  /**
   * Secret for `POST /api/v1/dev/email/test` (header `x-email-test-secret`).
   * Set in `.env` to enable Postman/curl delivery checks without going through signup.
   */
  EMAIL_TEST_SECRET: (process.env["EMAIL_TEST_SECRET"] ?? "").trim(),
} as const;
