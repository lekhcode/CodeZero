import { BrainCacheRevisionStatus, type BrainCachePlaylist, type Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { mapProblemRowToDetailResponse } from "../leetcode/leetcode.mapper.js";
import { startOfUtcDay } from "../assignments/studyPlanAssignment.js";
import type { BrainCacheRevisionTaskDto } from "./brainCache.types.js";

function parseCustomDates(raw: Prisma.JsonValue | null): string[] {
  if (raw === null || !Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v));
}

function dateFromKey(key: string): Date {
  const parts = key.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(Date.UTC(y, m - 1, d));
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return startOfUtcDay(next);
}

export function resolveRevisionStatus(
  stored: BrainCacheRevisionStatus,
  dueDate: Date,
  today: Date,
): BrainCacheRevisionStatus {
  if (stored === BrainCacheRevisionStatus.COMPLETED || stored === BrainCacheRevisionStatus.SKIPPED) {
    return stored;
  }
  const due = startOfUtcDay(dueDate).getTime();
  const t = startOfUtcDay(today).getTime();
  if (due < t) return BrainCacheRevisionStatus.OVERDUE;
  if (due === t) return BrainCacheRevisionStatus.DUE;
  return BrainCacheRevisionStatus.PENDING;
}

/** Align open task rows with calendar (PENDING/DUE/OVERDUE). */
export async function refreshOpenRevisionStatuses(userId: string): Promise<void> {
  const today = startOfUtcDay(new Date());
  const open = await prisma.brainCacheRevisionTask.findMany({
    where: {
      userId,
      status: {
        in: [
          BrainCacheRevisionStatus.PENDING,
          BrainCacheRevisionStatus.DUE,
          BrainCacheRevisionStatus.OVERDUE,
        ],
      },
    },
    select: { id: true, dueDate: true, status: true },
  });

  await Promise.all(
    open.map((row) => {
      const next = resolveRevisionStatus(row.status, row.dueDate, today);
      if (next === row.status) return Promise.resolve();
      return prisma.brainCacheRevisionTask.update({
        where: { id: row.id },
        data: { status: next },
      });
    }),
  );
}

async function upsertOpenTask(input: {
  userId: string;
  playlistId: string;
  playlistProblemId: string;
  problemId: string;
  dueDate: Date;
}): Promise<void> {
  const today = startOfUtcDay(new Date());
  const status = resolveRevisionStatus(BrainCacheRevisionStatus.PENDING, input.dueDate, today);

  await prisma.brainCacheRevisionTask.upsert({
    where: {
      playlistProblemId_dueDate: {
        playlistProblemId: input.playlistProblemId,
        dueDate: startOfUtcDay(input.dueDate),
      },
    },
    create: {
      userId: input.userId,
      playlistId: input.playlistId,
      playlistProblemId: input.playlistProblemId,
      problemId: input.problemId,
      dueDate: startOfUtcDay(input.dueDate),
      status,
    },
    update: { status },
  });
}

/** Seed revision tasks when a problem joins a playlist. */
export async function generateInitialRevisionTasks(input: {
  userId: string;
  playlist: Pick<BrainCachePlaylist, "id" | "revisionIntervalDays" | "customRevisionDates">;
  playlistProblemId: string;
  problemId: string;
}): Promise<void> {
  const today = startOfUtcDay(new Date());
  const firstDue = addUtcDays(today, input.playlist.revisionIntervalDays);
  await upsertOpenTask({
    userId: input.userId,
    playlistId: input.playlist.id,
    playlistProblemId: input.playlistProblemId,
    problemId: input.problemId,
    dueDate: firstDue,
  });

  const customKeys = parseCustomDates(input.playlist.customRevisionDates);
  const seen = new Set<string>([dateKey(firstDue)]);
  for (const key of customKeys) {
    const due = dateFromKey(key);
    if (due.getTime() < today.getTime()) continue;
    const k = dateKey(due);
    if (seen.has(k)) continue;
    seen.add(k);
    await upsertOpenTask({
      userId: input.userId,
      playlistId: input.playlist.id,
      playlistProblemId: input.playlistProblemId,
      problemId: input.problemId,
      dueDate: due,
    });
  }
}

/** Schedule the next interval revision after completion. */
export async function scheduleNextIntervalRevision(input: {
  userId: string;
  playlist: Pick<BrainCachePlaylist, "id" | "revisionIntervalDays">;
  playlistProblemId: string;
  problemId: string;
  fromDate: Date;
}): Promise<void> {
  const due = addUtcDays(startOfUtcDay(input.fromDate), input.playlist.revisionIntervalDays);
  await upsertOpenTask({
    userId: input.userId,
    playlistId: input.playlist.id,
    playlistProblemId: input.playlistProblemId,
    problemId: input.problemId,
    dueDate: due,
  });
}

const taskInclude = {
  playlist: { select: { name: true } },
  problem: true,
} satisfies Prisma.BrainCacheRevisionTaskInclude;

function mapTaskRow(
  row: Prisma.BrainCacheRevisionTaskGetPayload<{ include: typeof taskInclude }>,
): BrainCacheRevisionTaskDto {
  const detail = mapProblemRowToDetailResponse(row.problem);
  return {
    id: row.id,
    playlistId: row.playlistId,
    playlistName: row.playlist.name,
    playlistProblemId: row.playlistProblemId,
    problem: {
      id: row.problem.id,
      slug: detail.slug,
      title: detail.title,
      difficulty: row.problem.difficulty,
      topics: detail.topics,
    },
    dueDate: dateKey(row.dueDate),
    completedAt: row.completedAt?.toISOString() ?? null,
    status: row.status,
  };
}

export async function listTodayRevisions(userId: string): Promise<BrainCacheRevisionTaskDto[]> {
  await refreshOpenRevisionStatuses(userId);
  const today = startOfUtcDay(new Date());
  const rows = await prisma.brainCacheRevisionTask.findMany({
    where: {
      userId,
      dueDate: today,
      status: { in: [BrainCacheRevisionStatus.DUE, BrainCacheRevisionStatus.PENDING] },
    },
    include: taskInclude,
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapTaskRow);
}

/** Revisions marked complete today (UTC calendar day). */
export async function listSolvedTodayRevisions(userId: string): Promise<BrainCacheRevisionTaskDto[]> {
  const today = startOfUtcDay(new Date());
  const tomorrow = addUtcDays(today, 1);
  const rows = await prisma.brainCacheRevisionTask.findMany({
    where: {
      userId,
      status: BrainCacheRevisionStatus.COMPLETED,
      completedAt: { gte: today, lt: tomorrow },
    },
    include: taskInclude,
    orderBy: [{ completedAt: "desc" }],
  });
  return rows.map(mapTaskRow);
}

export async function listOverdueRevisions(userId: string): Promise<BrainCacheRevisionTaskDto[]> {
  await refreshOpenRevisionStatuses(userId);
  const today = startOfUtcDay(new Date());
  const rows = await prisma.brainCacheRevisionTask.findMany({
    where: {
      userId,
      dueDate: { lt: today },
      status: { in: [BrainCacheRevisionStatus.OVERDUE, BrainCacheRevisionStatus.PENDING, BrainCacheRevisionStatus.DUE] },
    },
    include: taskInclude,
    orderBy: [{ dueDate: "desc" }, { createdAt: "asc" }],
  });
  return rows.map(mapTaskRow);
}

export async function completeRevision(userId: string, taskId: string): Promise<BrainCacheRevisionTaskDto> {
  await refreshOpenRevisionStatuses(userId);
  const row = await prisma.brainCacheRevisionTask.findFirst({
    where: { id: taskId, userId },
    include: { playlist: true, playlistProblem: true },
  });
  if (row === null) {
    throw new Error("NOT_FOUND");
  }
  if (
    row.status === BrainCacheRevisionStatus.COMPLETED ||
    row.status === BrainCacheRevisionStatus.SKIPPED
  ) {
    throw new Error("ALREADY_CLOSED");
  }

  const now = new Date();
  const updated = await prisma.brainCacheRevisionTask.update({
    where: { id: taskId },
    data: {
      status: BrainCacheRevisionStatus.COMPLETED,
      completedAt: now,
    },
    include: taskInclude,
  });

  await scheduleNextIntervalRevision({
    userId,
    playlist: row.playlist,
    playlistProblemId: row.playlistProblemId,
    problemId: row.problemId,
    fromDate: now,
  });

  return mapTaskRow(updated);
}

export async function skipRevision(userId: string, taskId: string): Promise<BrainCacheRevisionTaskDto> {
  await refreshOpenRevisionStatuses(userId);
  const row = await prisma.brainCacheRevisionTask.findFirst({
    where: { id: taskId, userId },
    include: { playlist: true },
  });
  if (row === null) {
    throw new Error("NOT_FOUND");
  }

  const updated = await prisma.brainCacheRevisionTask.update({
    where: { id: taskId },
    data: {
      status: BrainCacheRevisionStatus.SKIPPED,
      completedAt: new Date(),
    },
    include: taskInclude,
  });

  await scheduleNextIntervalRevision({
    userId,
    playlist: row.playlist,
    playlistProblemId: row.playlistProblemId,
    problemId: row.problemId,
    fromDate: new Date(),
  });

  return mapTaskRow(updated);
}

export async function countOpenByPlaylist(
  userId: string,
  playlistIds: string[],
): Promise<Map<string, { due: number; overdue: number }>> {
  if (playlistIds.length === 0) return new Map();
  await refreshOpenRevisionStatuses(userId);
  const today = startOfUtcDay(new Date());

  const map = new Map<string, { due: number; overdue: number }>();
  for (const id of playlistIds) {
    map.set(id, { due: 0, overdue: 0 });
  }

  const overdueRows = await prisma.brainCacheRevisionTask.groupBy({
    by: ["playlistId"],
    where: {
      userId,
      playlistId: { in: playlistIds },
      dueDate: { lt: today },
      status: {
        in: [
          BrainCacheRevisionStatus.OVERDUE,
          BrainCacheRevisionStatus.PENDING,
          BrainCacheRevisionStatus.DUE,
        ],
      },
    },
    _count: { _all: true },
  });

  for (const g of overdueRows) {
    const entry = map.get(g.playlistId) ?? { due: 0, overdue: 0 };
    entry.overdue = g._count._all;
    map.set(g.playlistId, entry);
  }

  const dueRows = await prisma.brainCacheRevisionTask.groupBy({
    by: ["playlistId"],
    where: {
      userId,
      playlistId: { in: playlistIds },
      dueDate: today,
      status: { in: [BrainCacheRevisionStatus.DUE, BrainCacheRevisionStatus.PENDING] },
    },
    _count: { _all: true },
  });

  for (const g of dueRows) {
    const entry = map.get(g.playlistId) ?? { due: 0, overdue: 0 };
    entry.due = g._count._all;
    map.set(g.playlistId, entry);
  }

  return map;
}
