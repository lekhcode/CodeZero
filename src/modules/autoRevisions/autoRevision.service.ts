import { AutoRevisionType, type DifficultyLevel, type Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  computeRevisionSchedules,
  isWeeklyDueOnDate,
  monthRangeForOffset,
  toDateKey,
  weekRangeForOffset,
} from "./autoRevision.schedule.js";
import type {
  AutoRevisionDto,
  AutoRevisionGroupedToday,
  AutoRevisionMonthResponse,
  AutoRevisionSummary,
  AutoRevisionWeekResponse,
} from "./autoRevision.types.js";

const DEFAULT_TZ = "UTC";

function resolveTimezone(tz: string | undefined): string {
  const t = tz?.trim();
  if (t === undefined || t.length === 0) return DEFAULT_TZ;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: t });
    return t;
  } catch {
    return DEFAULT_TZ;
  }
}

type AutoRevisionRow = Prisma.AutoRevisionGetPayload<{
  include: { problem: { select: { slug: true } } };
}>;

function mapRow(row: AutoRevisionRow): AutoRevisionDto {
  return {
    id: row.id,
    userId: row.userId,
    problemId: row.problemId,
    problemTitle: row.problemTitle,
    difficulty: row.difficulty,
    slug: row.problem.slug,
    solvedAt: row.solvedAt.toISOString(),
    revisionType: row.revisionType,
    scheduledFor: row.scheduledFor.toISOString().slice(0, 10),
    isRevised: row.isRevised,
    revisedAt: row.revisedAt?.toISOString() ?? null,
  };
}

function dateKeyFromDb(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export type LogAutoRevisionInput = {
  userId: string;
  problemId: string;
  problemTitle?: string;
  difficulty?: DifficultyLevel;
  solvedAt?: Date;
  timezone?: string;
};

/**
 * Schedule daily / weekly / monthly revisions for a solved problem.
 * Same calendar-day re-solve updates schedules instead of duplicating rows.
 */
export async function logAutoRevision(input: LogAutoRevisionInput): Promise<{ created: number }> {
  const timeZone = resolveTimezone(input.timezone);
  const solvedAt = input.solvedAt ?? new Date();

  const problem = await prisma.problem.findUnique({
    where: { id: input.problemId },
    select: { id: true, title: true, difficulty: true },
  });
  if (problem === null) {
    throw ApiError.notFound("Problem not found");
  }

  const problemTitle = input.problemTitle ?? problem.title;
  const difficulty = input.difficulty ?? problem.difficulty;
  const schedules = computeRevisionSchedules(solvedAt, timeZone);
  const solveDay = toDateKey(solvedAt, timeZone);

  const existing = await prisma.autoRevision.findFirst({
    where: { userId: input.userId, problemId: input.problemId },
    select: { solvedAt: true },
  });
  const priorSolveDay =
    existing !== null ? toDateKey(existing.solvedAt, timeZone) : null;
  const sameCalendarDay = priorSolveDay === solveDay;

  const entries: Array<{
    revisionType: AutoRevisionType;
    scheduledFor: string;
  }> = [
    { revisionType: AutoRevisionType.DAILY, scheduledFor: schedules.daily },
    { revisionType: AutoRevisionType.WEEKLY, scheduledFor: schedules.weekly },
    { revisionType: AutoRevisionType.MONTHLY, scheduledFor: schedules.monthly },
  ];

  for (const entry of entries) {
    await prisma.autoRevision.upsert({
      where: {
        userId_problemId_revisionType: {
          userId: input.userId,
          problemId: input.problemId,
          revisionType: entry.revisionType,
        },
      },
      create: {
        userId: input.userId,
        problemId: input.problemId,
        problemTitle,
        difficulty,
        solvedAt,
        revisionType: entry.revisionType,
        scheduledFor: new Date(`${entry.scheduledFor}T00:00:00.000Z`),
        scheduleTimezone: timeZone,
      },
      update: {
        problemTitle,
        difficulty,
        solvedAt,
        scheduledFor: new Date(`${entry.scheduledFor}T00:00:00.000Z`),
        scheduleTimezone: timeZone,
        ...(!sameCalendarDay ? { isRevised: false, revisedAt: null } : {}),
      },
    });
  }

  return { created: existing === null ? 3 : 0 };
}

/** Fire-and-forget entry from judge worker — never throws to caller. */
export async function logAutoRevisionFromSolve(userId: string, problemId: string): Promise<void> {
  await logAutoRevision({ userId, problemId, timezone: DEFAULT_TZ });
}

async function fetchRows(
  userId: string,
  where: Prisma.AutoRevisionWhereInput,
): Promise<AutoRevisionDto[]> {
  const rows = await prisma.autoRevision.findMany({
    where: { userId, ...where },
    include: { problem: { select: { slug: true } } },
    orderBy: [{ scheduledFor: "asc" }, { problemTitle: "asc" }],
  });
  return rows.map(mapRow);
}

export async function getTodayRevisions(
  userId: string,
  timezone?: string,
): Promise<AutoRevisionGroupedToday> {
  const timeZone = resolveTimezone(timezone);
  const todayKey = toDateKey(new Date(), timeZone);
  const rows = await fetchRows(userId, {});

  const daily: AutoRevisionDto[] = [];
  const weekly: AutoRevisionDto[] = [];
  const monthly: AutoRevisionDto[] = [];

  for (const row of rows) {
    const sched = row.scheduledFor;
    let dueToday = false;
    if (row.revisionType === AutoRevisionType.DAILY) {
      dueToday = sched === todayKey;
    } else if (row.revisionType === AutoRevisionType.WEEKLY) {
      dueToday = isWeeklyDueOnDate(sched, todayKey, timeZone);
    } else if (row.revisionType === AutoRevisionType.MONTHLY) {
      dueToday = sched === todayKey;
    }
    if (!dueToday) continue;
    if (row.revisionType === AutoRevisionType.DAILY) daily.push(row);
    else if (row.revisionType === AutoRevisionType.WEEKLY) weekly.push(row);
    else monthly.push(row);
  }

  return { daily, weekly, monthly };
}

export async function getWeekRevisions(
  userId: string,
  weekOffset: number,
  timezone?: string,
): Promise<AutoRevisionWeekResponse> {
  const timeZone = resolveTimezone(timezone);
  const range = weekRangeForOffset(weekOffset, timeZone);
  const rows = await prisma.autoRevision.findMany({
    where: {
      userId,
      scheduledFor: {
        gte: new Date(`${range.start}T00:00:00.000Z`),
        lte: new Date(`${range.end}T00:00:00.000Z`),
      },
    },
    include: { problem: { select: { slug: true } } },
    orderBy: [{ scheduledFor: "asc" }, { problemTitle: "asc" }],
  });

  const problems = rows.map(mapRow);
  const totalScheduled = problems.length;
  const totalRevised = problems.filter((p) => p.isRevised).length;

  return {
    weekRange: { start: range.start, end: range.end, label: range.label },
    weekOffset,
    problems,
    totalScheduled,
    totalRevised,
  };
}

export async function getMonthRevisions(
  userId: string,
  monthOffset: number,
  timezone?: string,
): Promise<AutoRevisionMonthResponse> {
  const timeZone = resolveTimezone(timezone);
  const range = monthRangeForOffset(monthOffset, timeZone);
  const rows = await prisma.autoRevision.findMany({
    where: {
      userId,
      scheduledFor: {
        gte: new Date(`${range.start}T00:00:00.000Z`),
        lte: new Date(`${range.end}T00:00:00.000Z`),
      },
    },
    include: { problem: { select: { slug: true } } },
    orderBy: [{ scheduledFor: "asc" }, { problemTitle: "asc" }],
  });

  const problems = rows.map(mapRow);
  return {
    monthLabel: range.label,
    monthOffset,
    range: { start: range.start, end: range.end },
    problems,
    totalScheduled: problems.length,
    totalRevised: problems.filter((p) => p.isRevised).length,
  };
}

export async function markAutoRevisionRevised(userId: string, id: string): Promise<AutoRevisionDto> {
  const row = await prisma.autoRevision.findFirst({
    where: { id, userId },
    include: { problem: { select: { slug: true } } },
  });
  if (row === null) {
    throw ApiError.notFound("Auto-revision not found");
  }
  if (row.isRevised) {
    return mapRow(row);
  }
  const updated = await prisma.autoRevision.update({
    where: { id },
    data: { isRevised: true, revisedAt: new Date() },
    include: { problem: { select: { slug: true } } },
  });
  return mapRow(updated);
}

export async function getAutoRevisionSummary(
  userId: string,
  timezone?: string,
): Promise<AutoRevisionSummary> {
  const timeZone = resolveTimezone(timezone);
  const todayKey = toDateKey(new Date(), timeZone);
  const week = weekRangeForOffset(0, timeZone);
  const month = monthRangeForOffset(0, timeZone);

  const [allOpen, weekRows, monthRows] = await Promise.all([
    prisma.autoRevision.findMany({
      where: { userId, isRevised: false },
      select: { revisionType: true, scheduledFor: true },
    }),
    prisma.autoRevision.count({
      where: {
        userId,
        isRevised: false,
        scheduledFor: {
          gte: new Date(`${week.start}T00:00:00.000Z`),
          lte: new Date(`${week.end}T00:00:00.000Z`),
        },
      },
    }),
    prisma.autoRevision.count({
      where: {
        userId,
        isRevised: false,
        scheduledFor: {
          gte: new Date(`${month.start}T00:00:00.000Z`),
          lte: new Date(`${month.end}T00:00:00.000Z`),
        },
      },
    }),
  ]);

  let todayPending = 0;
  for (const row of allOpen) {
    const sched = dateKeyFromDb(row.scheduledFor);
    if (row.revisionType === AutoRevisionType.DAILY && sched === todayKey) todayPending += 1;
    else if (row.revisionType === AutoRevisionType.WEEKLY && isWeeklyDueOnDate(sched, todayKey, timeZone)) {
      todayPending += 1;
    } else if (row.revisionType === AutoRevisionType.MONTHLY && sched === todayKey) todayPending += 1;
  }

  return {
    todayPending,
    weekPending: weekRows,
    monthPending: monthRows,
  };
}
