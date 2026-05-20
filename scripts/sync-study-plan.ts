/**
 * Sync a study plan's problem list from LeetCode into `problems` + `template_problems`.
 *
 * Usage: tsx scripts/sync-study-plan.ts <template-slug>
 *   npm run sync:blind-75
 *   npm run sync:top-interview-150
 *   npm run sync:neetcode-150
 *
 * Optional: SYNC_DELAY_MS=400 (default 350) between LeetCode requests.
 */
import "dotenv/config";
import { prisma } from "../src/config/prisma.js";
import { syncStudyPlan } from "../src/modules/plans/studyPlan.sync.service.js";

async function main(): Promise<void> {
  const templateSlug = process.argv[2];
  if (templateSlug === undefined || templateSlug.length === 0) {
    throw new Error("Usage: tsx scripts/sync-study-plan.ts <template-slug>");
  }

  const result = await syncStudyPlan(templateSlug);
  console.log(
    `Done (${result.templateSlug}). synced=${result.synced} stubbed=${result.stubbed} linked=${result.linked} failed=${result.failed}`,
  );
  if (result.failures.length > 0) {
    console.error("Failures:", result.failures);
    process.exitCode = 1;
  }
}

void main()
  .catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
