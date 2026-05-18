import { BrainCacheRevisionStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { startOfUtcDay } from "../assignments/studyPlanAssignment.js";
import { refreshOpenRevisionStatuses } from "./brainCache.revision.service.js";
import type { BrainCacheAnalyticsDto } from "./brainCache.types.js";

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Consecutive UTC days (ending today) with at least one completed revision. */
async function computeRevisionStreak(userId: string): Promise<number> {
  const completed = await prisma.brainCacheRevisionTask.findMany({
    where: { userId, status: BrainCacheRevisionStatus.COMPLETED, completedAt: { not: null } },
    select: { completedAt: true },
    orderBy: { completedAt: "desc" },
    take: 400,
  });

  const daySet = new Set<string>();
  for (const row of completed) {
    if (row.completedAt !== null) {
      daySet.add(dateKey(startOfUtcDay(row.completedAt)));
    }
  }

  let streak = 0;
  const cursor = startOfUtcDay(new Date());
  while (daySet.has(dateKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function getAnalytics(userId: string): Promise<BrainCacheAnalyticsDto> {
  await refreshOpenRevisionStatuses(userId);
  const today = startOfUtcDay(new Date());
  const windowStart = new Date(today);
  windowStart.setUTCDate(windowStart.getUTCDate() - 30);

  const [totalCompleted, overdueCount, dueTodayCount, windowTasks, playlists] = await Promise.all([
    prisma.brainCacheRevisionTask.count({
      where: { userId, status: BrainCacheRevisionStatus.COMPLETED },
    }),
    prisma.brainCacheRevisionTask.count({
      where: {
        userId,
        dueDate: { lt: today },
        status: {
          in: [
            BrainCacheRevisionStatus.OVERDUE,
            BrainCacheRevisionStatus.PENDING,
            BrainCacheRevisionStatus.DUE,
          ],
        },
      },
    }),
    prisma.brainCacheRevisionTask.count({
      where: {
        userId,
        dueDate: today,
        status: { in: [BrainCacheRevisionStatus.DUE, BrainCacheRevisionStatus.PENDING] },
      },
    }),
    prisma.brainCacheRevisionTask.findMany({
      where: {
        userId,
        dueDate: { gte: windowStart, lte: today },
        status: {
          in: [
            BrainCacheRevisionStatus.COMPLETED,
            BrainCacheRevisionStatus.OVERDUE,
            BrainCacheRevisionStatus.DUE,
            BrainCacheRevisionStatus.PENDING,
            BrainCacheRevisionStatus.SKIPPED,
          ],
        },
      },
      select: { status: true },
    }),
    prisma.brainCachePlaylist.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        _count: { select: { problems: true } },
        tasks: {
          where: { status: BrainCacheRevisionStatus.COMPLETED },
          select: { id: true },
        },
      },
    }),
  ]);

  const windowTotal = windowTasks.length;
  const windowDone = windowTasks.filter((t) => t.status === BrainCacheRevisionStatus.COMPLETED).length;
  const completionRatePct =
    windowTotal > 0 ? Math.round((windowDone / windowTotal) * 100) : 0;

  const revisionStreakDays = await computeRevisionStreak(userId);

  return {
    totalCompleted,
    overdueCount,
    dueTodayCount,
    completionRatePct,
    revisionStreakDays,
    playlistActivity: playlists.map((p) => ({
      playlistId: p.id,
      playlistName: p.name,
      completedCount: p.tasks.length,
      problemCount: p._count.problems,
    })),
  };
}
