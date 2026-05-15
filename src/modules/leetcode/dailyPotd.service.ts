import { prisma } from "../../config/prisma.js";
import { logger } from "../../config/logger.js";
import { ApiError } from "../../utils/ApiError.js";

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
