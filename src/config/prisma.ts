/**
 * Prisma Client singleton (Node.js dev hot-reload safe).
 *
 * Prisma ORM 7+: the datasource URL is not read from `schema.prisma`. The CLI uses `prisma.config.ts`;
 * at runtime we connect via the official `pg` driver using `@prisma/adapter-pg`.
 *
 * We use a shared `pg.Pool` (not only `{ connectionString }` on the adapter) so connection handling
 * matches production-style pooling and avoids subtle driver/adapter issues with commits.
 *
 * Why: In dev, `tsx watch` reloads modules; without a global guard you'd create many
 * DB pools and exhaust connections. In prod, modules load once — same pattern, no harm.
 */
import "./loadEnv.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import { env } from "./env.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: pg.Pool | undefined;
};

const logLevels =
  process.env["NODE_ENV"] === "development"
    ? (["error", "warn"] as const)
    : (["error"] as const);

/** Set `PRISMA_LOG_QUERIES=true` in `.env` to print SQL (helpful when debugging writes). */
const prismaLog =
  process.env["PRISMA_LOG_QUERIES"] === "true"
    ? (["query", "error", "warn"] as const)
    : logLevels;

function createPool(): pg.Pool {
  return new pg.Pool({
    connectionString: env.DATABASE_URL,
  });
}

function createPrismaClient(): PrismaClient {
  globalForPrisma.pgPool ??= createPool();
  const adapter = new PrismaPg(globalForPrisma.pgPool, { disposeExternalPool: true });
  return new PrismaClient({
    adapter,
    log: [...prismaLog],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
