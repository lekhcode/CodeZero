import { AutoRevisionType, type DifficultyLevel, type Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  addCalendarDays,
  computeRevisionSchedules,
  isMonthlyVisible,
  isWeeklyVisible,
  monthRangeForOffset,
  toDateKey,
  weekRangeForOffset,
  weeklyVisibleScheduledForRange,
} from "./autoRevision.schedule.js";
import type {
  AutoRevisionActivityResponse,
  AutoRevisionDto,
  AutoRevisionFeedResponse,
  AutoRevisionGroupedToday,
  AutoRevisionHistoryItem,
  AutoRevisionHistoryResponse,
  AutoRevisionHistoryStatus,
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
  include: { problem: { select: { slug: true; topics: true } } };
}>;

const problemInclude = { problem: { select: { slug: true, topics: true } } } as const;

function mapRow(row: AutoRevisionRow, streak = 0, todayKey?: string): AutoRevisionDto {
  const scheduledFor = row.scheduledFor.toISOString().slice(0, 10);
  const topics = row.problem.topics;
  return {
    id: row.id,
    userId: row.userId,
    problemId: row.problemId,
    problemTitle: row.problemTitle,
    difficulty: row.difficulty,
    slug: row.problem.slug,
    topics,
    primaryTopic: topics[0] ?? "General",
    revisionStreak: streak,
    solvedAt: row.solvedAt.toISOString(),
    revisionType: row.revisionType,
    scheduledFor,
    isRevised: row.isRevised,
    revisedAt: row.revisedAt?.toISOString() ?? null,
    isOverdue: todayKey !== undefined && !row.isRevised && scheduledFor < todayKey,
  };
}

async function streakCountsForProblems(
  userId: string,
  problemIds: string[],
): Promise<Map<string, number>> {
  if (problemIds.length === 0) return new Map();
  const groups = await prisma.autoRevision.groupBy({
    by: ["problemId"],
    where: { userId, problemId: { in: problemIds }, isRevised: true },
    _count: { _all: true },
  });
  return new Map(groups.map((g) => [g.problemId, g._count._all]));
}

async function mapRowsWithStreaks(
  rows: AutoRevisionRow[],
  userId: string,
  todayKey?: string,
): Promise<AutoRevisionDto[]> {
  const problemIds = [...new Set(rows.map((r) => r.problemId))];
  const streaks = await streakCountsForProblems(userId, problemIds);
  return rows.map((row) => mapRow(row, streaks.get(row.problemId) ?? 0, todayKey));
}

function historyStatus(row: AutoRevisionRow, todayKey: string): AutoRevisionHistoryStatus {
  if (row.isRevised) return "completed";
  if (row.scheduledFor.toISOString().slice(0, 10) < todayKey) return "missed";
  return "skipped";
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
  const prior = await prisma.autoRevision.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { scheduleTimezone: true },
  });
  const timezone = prior?.scheduleTimezone ?? env.DAILY_POTD_CRON.timezone;
  await logAutoRevision({ userId, problemId, timezone });
}

async function fetchRows(
  userId: string,
  where: Prisma.AutoRevisionWhereInput,
  todayKey?: string,
): Promise<AutoRevisionDto[]> {
  const rows = await prisma.autoRevision.findMany({
    where: { userId, ...where },
    include: problemInclude,
    orderBy: [{ scheduledFor: "asc" }, { problemTitle: "asc" }],
  });
  return mapRowsWithStreaks(rows, userId, todayKey);
}

export type RevisionFeedQuery = {
  status?: "pending" | "completed" | "all";
  period?: "all" | "today" | "week" | "month";
  topic?: string;
  search?: string;
  sort?: "priority" | "due" | "title" | "difficulty";
};

const TOPIC_FILTER_MAP: Record<string, string> = {
  arrays: "Array",
  graph: "Graph",
  dp: "Dynamic Programming",
  trees: "Tree",
};

function normalizeTopicFilter(topic: string): string {
  const key = topic.trim().toLowerCase();
  return TOPIC_FILTER_MAP[key] ?? topic.trim();
}

const DIFFICULTY_RANK: Record<DifficultyLevel, number> = {
  EASY: 0,
  MEDIUM: 1,
  HARD: 2,
  MIXED: 1,
};

function sortFeedItems(items: AutoRevisionDto[], sort: RevisionFeedQuery["sort"], todayKey: string): void {
  const mode = sort ?? "priority";
  items.sort((a, b) => {
    if (mode === "title") return a.problemTitle.localeCompare(b.problemTitle);
    if (mode === "difficulty") {
      return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
    }
    if (mode === "due") return a.scheduledFor.localeCompare(b.scheduledFor);
    const aOver = a.isOverdue ? 0 : a.scheduledFor === todayKey ? 1 : 2;
    const bOver = b.isOverdue ? 0 : b.scheduledFor === todayKey ? 1 : 2;
    if (aOver !== bOver) return aOver - bOver;
    return a.scheduledFor.localeCompare(b.scheduledFor);
  });
}

function phaseVisible(item: AutoRevisionDto, todayKey: string, timeZone: string): boolean {
  if (item.revisionType === AutoRevisionType.DAILY) {
    return item.scheduledFor === todayKey;
  }
  if (item.revisionType === AutoRevisionType.WEEKLY) {
    return isWeeklyVisible(item.scheduledFor, todayKey, timeZone);
  }
  return isMonthlyVisible(item.scheduledFor, todayKey);
}

function computeWeakTopics(items: AutoRevisionDto[]): Array<{ topic: string; pending: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.isRevised) continue;
    const topic = item.primaryTopic;
    counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([topic, pending]) => ({ topic, pending }))
    .sort((a, b) => b.pending - a.pending)
    .slice(0, 5);
}

export async function getRevisionFeed(
  userId: string,
  timezone: string | undefined,
  query: RevisionFeedQuery,
): Promise<AutoRevisionFeedResponse> {
  const timeZone = resolveTimezone(timezone);
  const todayKey = toDateKey(new Date(), timeZone);
  const month = monthRangeForOffset(0, timeZone);

  const where: Prisma.AutoRevisionWhereInput = { userId };
  const status = query.status ?? "pending";
  if (status === "pending") where.isRevised = false;
  else if (status === "completed") where.isRevised = true;

  const period = query.period ?? "all";
  if (period === "today") {
    where.revisionType = AutoRevisionType.DAILY;
    where.scheduledFor = new Date(`${todayKey}T00:00:00.000Z`);
  } else if (period === "week") {
    where.revisionType = AutoRevisionType.WEEKLY;
    where.scheduledFor = weeklyVisibleScheduledForRange(todayKey, timeZone);
  } else if (period === "month") {
    where.revisionType = AutoRevisionType.MONTHLY;
    where.scheduledFor = {
      gte: new Date(`${month.start}T00:00:00.000Z`),
      lte: new Date(`${month.end}T00:00:00.000Z`),
    };
  }

  if (query.topic !== undefined && query.topic.length > 0) {
    where.problem = { topics: { has: normalizeTopicFilter(query.topic) } };
  }

  if (query.search !== undefined && query.search.trim().length > 0) {
    where.problemTitle = { contains: query.search.trim(), mode: "insensitive" };
  }

  const rows = await prisma.autoRevision.findMany({
    where,
    include: problemInclude,
    orderBy: [{ scheduledFor: "asc" }, { problemTitle: "asc" }],
  });

  let items = await mapRowsWithStreaks(rows, userId, todayKey);
  sortFeedItems(items, query.sort, todayKey);

  if (status === "pending" && period === "all") {
    items = items.filter((item) => phaseVisible(item, todayKey, timeZone));
  } else if (period !== "all") {
    items = items.filter((item) => phaseVisible(item, todayKey, timeZone));
  }

  return { items, weakTopics: computeWeakTopics(items) };
}

export type RevisionHistoryQuery = {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  date?: string;
};

export async function getRevisionHistory(
  userId: string,
  timezone: string | undefined,
  query: RevisionHistoryQuery,
): Promise<AutoRevisionHistoryResponse> {
  const timeZone = resolveTimezone(timezone);
  const todayKey = toDateKey(new Date(), timeZone);
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Prisma.AutoRevisionWhereInput = {
    userId,
    OR: [
      { isRevised: true },
      {
        isRevised: false,
        scheduledFor: { lt: new Date(`${todayKey}T00:00:00.000Z`) },
      },
    ],
  };

  if (query.date !== undefined) {
    const dayStart = new Date(`${query.date}T00:00:00.000Z`);
    const dayEnd = new Date(`${query.date}T23:59:59.999Z`);
    where.AND = [
      {
        OR: [
          { revisedAt: { gte: dayStart, lte: dayEnd } },
          {
            isRevised: false,
            scheduledFor: new Date(`${query.date}T00:00:00.000Z`),
          },
        ],
      },
    ];
  } else if (query.from !== undefined || query.to !== undefined) {
    const range: Prisma.DateTimeFilter = {};
    if (query.from !== undefined) range.gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to !== undefined) range.lte = new Date(`${query.to}T23:59:59.999Z`);
    where.AND = [{ revisedAt: range }];
  }

  const [total, rows] = await Promise.all([
    prisma.autoRevision.count({ where }),
    prisma.autoRevision.findMany({
      where,
      include: problemInclude,
      orderBy: [{ revisedAt: "desc" }, { scheduledFor: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  const streaks = await streakCountsForProblems(userId, [...new Set(rows.map((r) => r.problemId))]);
  const items: AutoRevisionHistoryItem[] = rows.map((row) => ({
    ...mapRow(row, streaks.get(row.problemId) ?? 0, todayKey),
    status: historyStatus(row, todayKey),
    timeSpentMinutes: null,
    performanceScore: null,
    notes: null,
  }));

  return {
    items,
    page,
    limit,
    total,
    hasMore: skip + items.length < total,
  };
}

export async function getRevisionActivity(
  userId: string,
  timezone: string | undefined,
  months = 6,
): Promise<AutoRevisionActivityResponse> {
  const timeZone = resolveTimezone(timezone);
  const todayKey = toDateKey(new Date(), timeZone);
  const startKey = addCalendarDays(todayKey, -(months * 31), timeZone);
  const start = new Date(`${startKey}T00:00:00.000Z`);

  const rows = await prisma.autoRevision.findMany({
    where: { userId, isRevised: true, revisedAt: { gte: start } },
    select: { revisedAt: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.revisedAt === null) continue;
    const key = toDateKey(row.revisedAt, timeZone);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const days = [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { days };
}

export async function getTodayRevisions(
  userId: string,
  timezone?: string,
): Promise<AutoRevisionGroupedToday> {
  const timeZone = resolveTimezone(timezone);
  const todayKey = toDateKey(new Date(), timeZone);

  /** Yesterday's solve → due today (D+1). Weekly/monthly live in their own buckets. */
  const daily = await fetchRows(userId, {
    revisionType: AutoRevisionType.DAILY,
    scheduledFor: new Date(`${todayKey}T00:00:00.000Z`),
  });

  return { daily, weekly: [], monthly: [] };
}

export async function getWeekRevisions(
  userId: string,
  weekOffset: number,
  timezone?: string,
): Promise<AutoRevisionWeekResponse> {
  const timeZone = resolveTimezone(timezone);
  const todayKey = toDateKey(new Date(), timeZone);
  const range = weekRangeForOffset(weekOffset, timeZone);

  if (weekOffset !== 0) {
    return {
      weekRange: { start: range.start, end: range.end, label: range.label },
      weekOffset,
      problems: [],
      totalScheduled: 0,
      totalRevised: 0,
    };
  }

  const rows = await prisma.autoRevision.findMany({
    where: {
      userId,
      revisionType: AutoRevisionType.WEEKLY,
      scheduledFor: weeklyVisibleScheduledForRange(todayKey, timeZone),
    },
    include: problemInclude,
    orderBy: [{ scheduledFor: "asc" }, { problemTitle: "asc" }],
  });

  const visible = rows.filter((r) =>
    isWeeklyVisible(r.scheduledFor.toISOString().slice(0, 10), todayKey, timeZone),
  );
  const problems = await mapRowsWithStreaks(visible, userId, todayKey);
  const totalScheduled = problems.length;
  const totalRevised = problems.filter((p) => p.isRevised).length;

  const firstBatch =
    visible.length > 0 ? visible[0]!.scheduledFor.toISOString().slice(0, 10) : null;
  const label =
    firstBatch !== null
      ? `Active through ${addCalendarDays(firstBatch, 7, timeZone)}`
      : "No active weekly batch";

  return {
    weekRange: { start: range.start, end: range.end, label },
    weekOffset,
    problems,
    totalScheduled,
    totalRevised,
  };
}

function buildMonthStats(problems: AutoRevisionDto[], todayKey: string): {
  total: number;
  revised: number;
  pending: number;
  missed: number;
  completionPct: number;
} {
  const total = problems.length;
  const revised = problems.filter((p) => p.isRevised).length;
  const pending = problems.filter((p) => !p.isRevised).length;
  const missed = problems.filter(
    (p) => !p.isRevised && p.scheduledFor < todayKey,
  ).length;
  const completionPct = total === 0 ? 100 : Math.round((revised / total) * 100);
  return { total, revised, pending, missed, completionPct };
}

export async function getMonthRevisions(
  userId: string,
  monthOffset: number,
  timezone?: string,
): Promise<AutoRevisionMonthResponse> {
  const timeZone = resolveTimezone(timezone);
  const range = monthRangeForOffset(monthOffset, timeZone);
  const todayKey = toDateKey(new Date(), timeZone);

  const rows = await prisma.autoRevision.findMany({
    where: {
      userId,
      revisionType: AutoRevisionType.MONTHLY,
      scheduledFor: {
        gte: new Date(`${range.start}T00:00:00.000Z`),
        lte: new Date(`${range.end}T00:00:00.000Z`),
      },
    },
    include: problemInclude,
    orderBy: [{ scheduledFor: "desc" }, { problemTitle: "asc" }],
  });

  const visible = rows.filter((r) => {
    const key = r.scheduledFor.toISOString().slice(0, 10);
    return isMonthlyVisible(key, todayKey) || monthOffset < 0;
  });

  const problems = await mapRowsWithStreaks(visible, userId, todayKey);
  const stats = buildMonthStats(problems, todayKey);

  return {
    monthLabel: range.label,
    monthOffset,
    range: { start: range.start, end: range.end },
    problems,
    totalScheduled: problems.length,
    totalRevised: problems.filter((p) => p.isRevised).length,
    stats,
  };
}

export async function markAutoRevisionRevised(userId: string, id: string): Promise<AutoRevisionDto> {
  const row = await prisma.autoRevision.findFirst({
    where: { id, userId },
    include: problemInclude,
  });
  if (row === null) {
    throw ApiError.notFound("Auto-revision not found");
  }
  if (row.isRevised) {
    const todayKey = toDateKey(new Date(), resolveTimezone(row.scheduleTimezone));
    const [dto] = await mapRowsWithStreaks([row], userId, todayKey);
    return dto!;
  }
  const updated = await prisma.autoRevision.update({
    where: { id },
    data: { isRevised: true, revisedAt: new Date() },
    include: problemInclude,
  });
  const todayKey = toDateKey(new Date(), resolveTimezone(updated.scheduleTimezone));
  const [dto] = await mapRowsWithStreaks([updated], userId, todayKey);
  return dto!;
}

export async function getAutoRevisionSummary(
  userId: string,
  timezone?: string,
): Promise<AutoRevisionSummary> {
  const timeZone = resolveTimezone(timezone);
  const todayKey = toDateKey(new Date(), timeZone);
  const month = monthRangeForOffset(0, timeZone);

  const [todayRows, weekRows, monthRows] = await Promise.all([
    prisma.autoRevision.findMany({
      where: {
        userId,
        revisionType: AutoRevisionType.DAILY,
        scheduledFor: new Date(`${todayKey}T00:00:00.000Z`),
        isRevised: false,
      },
      select: { id: true },
    }),
    prisma.autoRevision.findMany({
      where: {
        userId,
        revisionType: AutoRevisionType.WEEKLY,
        isRevised: false,
        scheduledFor: weeklyVisibleScheduledForRange(todayKey, timeZone),
      },
      select: { scheduledFor: true },
    }),
    prisma.autoRevision.findMany({
      where: {
        userId,
        revisionType: AutoRevisionType.MONTHLY,
        isRevised: false,
        scheduledFor: {
          gte: new Date(`${month.start}T00:00:00.000Z`),
          lte: new Date(`${month.end}T00:00:00.000Z`),
        },
      },
      select: { scheduledFor: true },
    }),
  ]);

  const todayPending = todayRows.length;
  const weekPending = weekRows.filter((r) =>
    isWeeklyVisible(r.scheduledFor.toISOString().slice(0, 10), todayKey, timeZone),
  ).length;
  const monthPending = monthRows.filter((r) =>
    isMonthlyVisible(r.scheduledFor.toISOString().slice(0, 10), todayKey),
  ).length;

  const thirtyDaysAgoKey = addCalendarDays(todayKey, -30, timeZone);
  const thirtyDaysAgo = new Date(`${thirtyDaysAgoKey}T00:00:00.000Z`);

  const [totalPending, scheduled30Day, revised30Day] = await Promise.all([
    prisma.autoRevision.count({ where: { userId, isRevised: false } }),
    prisma.autoRevision.count({
      where: { userId, scheduledFor: { gte: thirtyDaysAgo } },
    }),
    prisma.autoRevision.count({
      where: { userId, isRevised: true, revisedAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  const completion30DayPct =
    scheduled30Day === 0 ? 100 : Math.round((revised30Day / scheduled30Day) * 100);

  return {
    todayPending,
    weekPending,
    monthPending,
    totalPending,
    completion30DayPct,
    scheduled30Day,
    revised30Day,
  };
}
