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

export const env = {
  NODE_ENV: nodeEnv,
  isProduction,
  PORT: port,
  /** Required once you run migrations / hit the DB */
  DATABASE_URL: requireEnv("DATABASE_URL"),
  CORS_ORIGINS: corsOrigins,
} as const;
