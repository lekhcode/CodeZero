/**
 * Seeds the canonical `ScheduleTemplate` catalog (POTD, topics, study plans).
 * Safe to re-run: upserts by `slug` so names/flags refresh without duplicate rows.
 */
import { loadSeedEnv } from "../scripts/load-seed-env.js";
import { createSeedPrisma, seedScheduleTemplates } from "./seed-schedules.js";

loadSeedEnv();

async function main(): Promise<void> {
  const { prisma, pool } = createSeedPrisma();
  try {
    const count = await seedScheduleTemplates(prisma);
    console.log(`Seeded ${count} schedule templates.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
