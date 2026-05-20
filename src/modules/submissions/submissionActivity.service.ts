import { JudgeMode, SubmissionStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import {
  currentStreakFromActiveDays,
  maxConsecutiveDayStreak,
  utcDateKey,
} from "./streak.utils.js";

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
  /** Consecutive UTC days with ≥1 ACCEPTED full submit (today or yesterday if today pending). */
  currentStreak: number;
  /** All-time longest consecutive active-day run (never drops when a streak breaks). */
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

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addUtcDaysDate(d: Date, days: number): Date {
  const x = startOfUtcDay(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function buildDayRange(start: Date, end: Date): string[] {
  const keys: string[] = [];
  const cursor = startOfUtcDay(start);
  const endDay = startOfUtcDay(end);
  while (cursor.getTime() <= endDay.getTime()) {
    keys.push(utcDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
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
  const today = startOfUtcDay(new Date());

  const useRolling = input.rolling === true || input.year === undefined;

  let rangeStart: Date;
  let rangeEnd: Date;
  let view: ActivityViewMode;
  let year: number | null;
  let rangeLabel: string;

  if (useRolling) {
    rangeEnd = today;
    rangeStart = addUtcDaysDate(today, -(ROLLING_DAY_COUNT - 1));
    view = "rolling";
    year = null;
    rangeLabel = "Last 12 months";
  } else {
    const y = input.year !== undefined && availableYears.includes(input.year) ? input.year : currentYear;
    rangeStart = new Date(Date.UTC(y, 0, 1));
    rangeEnd = y === currentYear ? today : startOfUtcDay(new Date(Date.UTC(y, 11, 31)));
    view = "calendar";
    year = y;
    rangeLabel = String(y);
  }

  const queryEnd = new Date(rangeEnd);
  queryEnd.setUTCHours(23, 59, 59, 999);

  const [rows, allAcceptedRows] = await Promise.all([
    prisma.judgeSubmission.findMany({
      where: {
        userId,
        createdAt: { gte: rangeStart, lte: queryEnd },
      },
      select: {
        createdAt: true,
        status: true,
        mode: true,
      },
    }),
    prisma.judgeSubmission.findMany({
      where: {
        userId,
        mode: JudgeMode.FULL_JUDGE,
        status: SubmissionStatus.ACCEPTED,
      },
      select: { createdAt: true },
    }),
  ]);

  /** Per-day full Submit clicks (FULL_JUDGE) — excludes Run / sample runs. */
  const countByDate = new Map<string, number>();
  const acceptedByDate = new Map<string, number>();

  for (const row of rows) {
    if (row.mode !== JudgeMode.FULL_JUDGE) continue;
    const key = utcDateKey(row.createdAt);
    countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
    if (row.status === SubmissionStatus.ACCEPTED) {
      acceptedByDate.set(key, (acceptedByDate.get(key) ?? 0) + 1);
    }
  }

  const allAcceptedDays = new Set<string>();
  for (const row of allAcceptedRows) {
    allAcceptedDays.add(utcDateKey(row.createdAt));
  }
  const todayKey = utcDateKey(new Date());
  const currentStreak = currentStreakFromActiveDays(allAcceptedDays, todayKey);
  const maxStreak = maxConsecutiveDayStreak([...allAcceptedDays].sort());

  let dayKeys: string[];
  if (view === "calendar" && year !== null) {
    const gridStart = new Date(Date.UTC(year, 0, 1));
    const gridEnd = new Date(Date.UTC(year, 11, 31));
    dayKeys = buildDayRange(gridStart, gridEnd);
  } else {
    dayKeys = buildDayRange(rangeStart, rangeEnd);
  }

  const days: ActivityDay[] = dayKeys.map((key) => ({
    date: key,
    count: countByDate.get(key) ?? 0,
    acceptedCount: acceptedByDate.get(key) ?? 0,
  }));

  const activeInRange = dayKeys.filter((k) => (acceptedByDate.get(k) ?? 0) > 0);

  return {
    view,
    year,
    rangeLabel,
    availableYears,
    totalSubmissions: rows.length,
    activeDays: activeInRange.length,
    currentStreak,
    maxStreak,
    days,
  };
}
