import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Load `.env` then `.env.seed` (tunnel DB on 5433 overrides local 5432). */
export function loadSeedEnv(): void {
  dotenv.config({ path: resolve(repoRoot, ".env") });
  const seedEnvPath = resolve(repoRoot, ".env.seed");
  if (existsSync(seedEnvPath)) {
    dotenv.config({ path: seedEnvPath, override: true });
  }
}

export function logDatabaseTarget(): void {
  const dbUrl = process.env["DATABASE_URL"] ?? "";
  if (dbUrl === "") {
    console.warn("DATABASE_URL missing — create .env.seed or set DATABASE_URL.");
    return;
  }
  try {
    const u = new URL(dbUrl);
    console.log(
      `DB target: ${u.hostname}:${u.port || "5432"}/${u.pathname.replace(/^\//, "")} (${u.username})`,
    );
  } catch {
    console.log("DB target: DATABASE_URL set");
  }
}
