/**
 * Prisma ORM 7+ CLI configuration (migrate, generate, studio).
 * The database URL is defined here instead of `schema.prisma` — see https://pris.ly/d/config-datasource
 */
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
