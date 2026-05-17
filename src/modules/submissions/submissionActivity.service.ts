import { JudgeMode, SubmissionStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";

const ROLLING_DAY_COUNT = 365;

export type ActivityDay = {
  date: string;
  count: number;
  acceptedCount: number;
};

export type ActivityViewMode = "rolling" | "calendar";

export type SubmissionActivitySummary = {
  view: ActivityViewMode;
  year: number | null;
  rangeLabel: string;
  availableYears: number[];
  totalSubmissions: number;
  activeDays: number;
  maxStreak: number;
  days: ActivityDay[];
};

/** Local calendar date key (matches user-facing "today"). */
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addLocalDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Longest run of consecutive calendar days in sorted ascending local date keys. */
export function maxConsecutiveDayStreak(sortedDateKeys: string[]): number {
  if (sortedDateKeys.length === 0) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < sortedDateKeys.length; i++) {
    const prev = new Date(sortedDateKeys[i - 1]!);
    const cur = new Date(sortedDateKeys[i]!);
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      current++;
    } else {
      current = 1;
    }
    if (current > best) best = current;
  }
  return best;
}

function buildDayRange(start: Date, end: Date): string[] {
  const keys: string[] = [];
  const cursor = startOfLocalDay(start);
  const endDay = startOfLocalDay(end);
  while (cursor.getTime() <= endDay.getTime()) {
    keys.push(localDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

async function resolveAvailableYears(userId: string): Promise<number[]> {
  const currentYear = new Date().getFullYear();
  const first = await prisma.judgeSubmission.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  const startYear = first !== null ? first.createdAt.getFullYear() : currentYear;
  const years: number[] = [];
  for (let y = currentYear; y >= startYear; y--) {
    years.push(y);
  }
  return years.length > 0 ? years : [currentYear];
}

type ActivityInput = {
  rolling?: boolean;
  year?: number;
};

export async function getSubmissionActivityForUser(
  userId: string,
  input: ActivityInput = {},
): Promise<SubmissionActivitySummary> {
  const availableYears = await resolveAvailableYears(userId);
  const currentYear = new Date().getFullYear();
  const today = startOfLocalDay(new Date());

  const useRolling = input.rolling === true || input.year === undefined;

  let rangeStart: Date;
  let rangeEnd: Date;
  let view: ActivityViewMode;
  let year: number | null;
  let rangeLabel: string;

  if (useRolling) {
    rangeEnd = today;
    rangeStart = addLocalDays(today, -(ROLLING_DAY_COUNT - 1));
    view = "rolling";
    year = null;
    rangeLabel = "Last 12 months";
  } else {
    const y = input.year !== undefined && availableYears.includes(input.year) ? input.year : currentYear;
    rangeStart = new Date(y, 0, 1);
    rangeEnd =
      y === currentYear
        ? today
        : startOfLocalDay(new Date(y, 11, 31));
    view = "calendar";
    year = y;
    rangeLabel = String(y);
  }

  const queryEnd = new Date(rangeEnd);
  queryEnd.setHours(23, 59, 59, 999);

  const rows = await prisma.judgeSubmission.findMany({
    where: {
      userId,
      createdAt: { gte: rangeStart, lte: queryEnd },
    },
    select: {
      createdAt: true,
      status: true,
      mode: true,
    },
  });

  const countByDate = new Map<string, number>();
  const acceptedDays = new Set<string>();

  for (const row of rows) {
    const key = localDateKey(row.createdAt);
    countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
    if (row.mode === JudgeMode.FULL_JUDGE && row.status === SubmissionStatus.ACCEPTED) {
      acceptedDays.add(key);
    }
  }

  let dayKeys: string[];
  if (view === "calendar" && year !== null) {
    const gridStart = new Date(year, 0, 1);
    const gridEnd = new Date(year, 11, 31);
    dayKeys = buildDayRange(gridStart, gridEnd);
  } else {
    dayKeys = buildDayRange(rangeStart, rangeEnd);
  }

  const days: ActivityDay[] = dayKeys.map((key) => ({
    date: key,
    count: countByDate.get(key) ?? 0,
    acceptedCount: acceptedDays.has(key) ? 1 : 0,
  }));

  const activeInRange = dayKeys.filter((k) => (countByDate.get(k) ?? 0) > 0);
  const acceptedInRange = [...acceptedDays].filter((k) => dayKeys.includes(k)).sort();

  return {
    view,
    year,
    rangeLabel,
    availableYears,
    totalSubmissions: rows.length,
    activeDays: activeInRange.length,
    maxStreak: maxConsecutiveDayStreak(acceptedInRange),
    days,
  };
}
