/**
 * Recompute WEEKLY auto-revision dates after the Saturday/Sunday anchor fix.
 * Run: npx tsx scripts/backfill-auto-revision-weekly.ts
 */
import { AutoRevisionType } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import { computeRevisionSchedules } from "../src/modules/autoRevisions/autoRevision.schedule.js";

const rows = await prisma.autoRevision.findMany({
  where: { revisionType: AutoRevisionType.WEEKLY },
  select: { id: true, solvedAt: true, scheduledFor: true, scheduleTimezone: true },
});

let updated = 0;
for (const row of rows) {
  const tz = row.scheduleTimezone || "UTC";
  const { weekly } = computeRevisionSchedules(row.solvedAt, tz);
  const next = new Date(`${weekly}T00:00:00.000Z`);
  const prev = row.scheduledFor.toISOString().slice(0, 10);
  if (prev === weekly) continue;
  await prisma.autoRevision.update({
    where: { id: row.id },
    data: { scheduledFor: next },
  });
  updated += 1;
  console.log(`updated ${row.id}: ${prev} → ${weekly} (${tz})`);
}

console.log(`Done. ${updated} / ${rows.length} weekly rows updated.`);

await prisma.$disconnect();
