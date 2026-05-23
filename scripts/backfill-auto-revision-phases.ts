/**
 * Recompute weekly/monthly scheduledFor dates after phase scheduling update.
 * Run: npx tsx scripts/backfill-auto-revision-phases.ts
 */
import { AutoRevisionType } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";
import {
  computeRevisionSchedules,
  toDateKey,
} from "../src/modules/autoRevisions/autoRevision.schedule.js";

const rows = await prisma.autoRevision.findMany({
  select: {
    id: true,
    revisionType: true,
    solvedAt: true,
    scheduleTimezone: true,
  },
});

let updated = 0;
for (const row of rows) {
  const tz = row.scheduleTimezone || "UTC";
  const schedules = computeRevisionSchedules(row.solvedAt, tz);
  const next =
    row.revisionType === AutoRevisionType.DAILY
      ? schedules.daily
      : row.revisionType === AutoRevisionType.WEEKLY
        ? schedules.weekly
        : schedules.monthly;

  const current = toDateKey(row.solvedAt, tz);
  void current;
  const scheduledFor = new Date(`${next}T00:00:00.000Z`);
  await prisma.autoRevision.update({
    where: { id: row.id },
    data: { scheduledFor },
  });
  updated += 1;
}

console.log(`backfill-auto-revision-phases: updated ${updated} rows`);
