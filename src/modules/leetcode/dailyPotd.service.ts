import type { DailyPotd, Problem } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { logger } from "../../config/logger.js";
import { ApiError } from "../../utils/ApiError.js";

export type DailyPotdWithProblem = DailyPotd & { problem: Problem };

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Parse LeetCode `activeDailyCodingChallengeQuestion.date` (e.g. `2026-05-15`) to a UTC date-only value.
 */
export function parseLeetcodeChallengeDate(raw: string): Date {
  const trimmed = raw.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (match === null) {
    throw new ApiError(502, "Invalid challenge date from LeetCode", {
      code: "LEETCODE_INVALID_DATE",
    });
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Record today's official POTD in `daily_potd` (upsert by `challengeDate` — no duplicate days).
 * Safe to call multiple times per day: same date updates `problemId` if LeetCode ever changes mid-day.
 */
export async function upsertDailyPotdSlot(params: {
  challengeDateRaw: string;
  problemId: string;
}): Promise<void> {
  const challengeDate = parseLeetcodeChallengeDate(params.challengeDateRaw);

  const row = await prisma.dailyPotd.upsert({
    where: { challengeDate },
    create: {
      challengeDate,
      problemId: params.problemId,
    },
    update: {
      problemId: params.problemId,
    },
    select: { id: true, challengeDate: true, problemId: true },
  });

  logger.info(
    {
      dailyPotdId: row.id,
      challengeDate: params.challengeDateRaw,
      problemId: row.problemId,
    },
    "daily POTD calendar slot saved",
  );
}

/**
 * Official POTD for the active challenge window (UTC today through +1 day).
 *
 * Assignment rows use UTC midnight; LeetCode's `challengeDate` can be one calendar day ahead.
 * Never returns slots before UTC today — that was causing yesterday's problem to appear as "today".
 */
export async function findTodayDailyPotdSlot(): Promise<DailyPotdWithProblem | null> {
  const todayUtc = startOfUtcDay(new Date());
  const tomorrowUtc = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000);
  const dayAfterTomorrowUtc = new Date(todayUtc.getTime() + 48 * 60 * 60 * 1000);

  const candidates = await prisma.dailyPotd.findMany({
    where: { challengeDate: { gte: todayUtc, lt: dayAfterTomorrowUtc } },
    include: { problem: true },
    orderBy: { challengeDate: "desc" },
  });

  if (candidates.length === 0) {
    return null;
  }

  const todayKey = utcDateKey(todayUtc);
  const tomorrowKey = utcDateKey(tomorrowUtc);

  const exactToday = candidates.find((row) => utcDateKey(row.challengeDate) === todayKey);
  if (exactToday !== undefined) {
    return exactToday;
  }

  const leetcodeAhead = candidates.find((row) => utcDateKey(row.challengeDate) === tomorrowKey);
  return leetcodeAhead ?? null;
}
