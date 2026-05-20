/**
 * Full server seed via SSH tunnel (.env.seed → port 5433):
 *   1. Schedule templates (Explore + My Schedules)
 *   2. LeetCode catalog dump (all non-premium metadata)
 *   3. Study plans: blind-75, top-interview-150, neetcode-150
 *   4. LeetCode details dump (statements/examples — slow)
 *
 *   npm run seed:server:full
 *
 * Requires: SSH tunnel open, LeetCode reachable from this machine.
 */
import { loadSeedEnv, logDatabaseTarget } from "./load-seed-env.js";

loadSeedEnv();
logDatabaseTarget();

const STUDY_PLANS = ["blind-75", "top-interview-150", "neetcode-150"] as const;

async function main(): Promise<void> {
  const { createSeedPrisma, seedScheduleTemplates } = await import("../prisma/seed-schedules.js");
  const { dumpCatalog, dumpDetails } = await import(
    "../src/modules/leetcode/leetcode.dump.service.js"
  );
  const { syncStudyPlan } = await import("../src/modules/plans/studyPlan.sync.service.js");
  const { prisma } = await import("../src/config/prisma.js");

  console.log("\n=== [1/4] Schedule templates (Explore / My Schedules) ===");
  const { prisma: seedPrisma, pool } = createSeedPrisma();
  try {
    const n = await seedScheduleTemplates(seedPrisma);
    console.log(`Done: ${n} templates (daily-potd, topics, blind-75, neetcode-150, top-interview-150).`);
  } finally {
    await seedPrisma.$disconnect();
    await pool.end();
  }

  console.log("\n=== [2/4] LeetCode catalog dump (POST /leetcode/dump/catalog) ===");
  const catalog = await dumpCatalog({ nonPremiumOnly: true, pageSize: 50 });
  console.log(
    `Catalog: total=${catalog.totalFromLeetcode} created=${catalog.created} updated=${catalog.updated} unchanged=${catalog.unchanged} (${catalog.durationMs}ms)`,
  );

  console.log("\n=== [3/4] Study plans (blind-75, top-interview-150, neetcode-150) ===");
  for (const slug of STUDY_PLANS) {
    console.log(`Syncing ${slug}…`);
    const result = await syncStudyPlan(slug);
    console.log(
      `  ${slug}: linked=${result.linked} synced=${result.synced} stubbed=${result.stubbed} failed=${result.failed}`,
    );
    if (result.failures.length > 0) {
      console.warn(`  failures:`, result.failures.slice(0, 5));
    }
  }

  console.log("\n=== [4/4] LeetCode details dump (POST /leetcode/dump/details) — may take 30–90+ min ===");
  const details = await dumpDetails({
    nonPremiumOnly: true,
    force: false,
    delayMs: Number(process.env["LEETCODE_DUMP_DELAY_MS"] ?? 350),
  });
  console.log(
    `Details: processed=${details.processed} synced=${details.synced} failed=${details.failed} remaining=${details.remaining} (${details.durationMs}ms)`,
  );
  if (details.failures.length > 0) {
    console.warn("Sample failures:", details.failures.slice(0, 10));
  }

  const [templates, problems, templateLinks] = await Promise.all([
    prisma.scheduleTemplate.count(),
    prisma.problem.count(),
    prisma.templateProblem.count(),
  ]);
  console.log(
    `\nAll done. DB totals: schedule_templates=${templates} problems=${problems} template_problems=${templateLinks}`,
  );
}

void main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/config/prisma.js");
    await prisma.$disconnect();
  });
