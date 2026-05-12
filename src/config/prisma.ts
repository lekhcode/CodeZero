/**
 * Prisma Client singleton (Node.js dev hot-reload safe).
 *
 * Why: In dev, `tsx watch` reloads modules; without a global guard you'd create many
 * DB pools and exhaust connections. In prod, modules load once — same pattern, no harm.
 *
 * We import `./loadEnv.js` first so `DATABASE_URL` exists before the client reads it.
 */
import "./loadEnv.js";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const logLevels =
  process.env["NODE_ENV"] === "development"
    ? (["error", "warn"] as const)
    : (["error"] as const);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [...logLevels],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
