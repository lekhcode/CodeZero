import type { Problem } from "@prisma/client";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { upsertDailyPotdSlot } from "./dailyPotd.service.js";
import { fetchDailyQuestionRaw, fetchQuestionDetailBySlug } from "./leetcode.client.js";
import {
  hasStoredDetail,
  mapDailyQuestionToNormalized,
  mapProblemRowToDetailResponse,
  mapQuestionDetailToNormalized,
  toProblemDetailResponse,
  toProblemDetailUpsertData,
} from "./leetcode.mapper.js";
import type { ProblemDetailResponse } from "./leetcode.types.js";

/**
 * Sync full problem row + API DTO. Returns DB row so callers can link calendar tables (e.g. `daily_potd`).
 */
async function syncProblemBySlug(slug: string): Promise<{
  row: Problem;
  response: ProblemDetailResponse;
}> {
  const cached = await prisma.problem.findUnique({ where: { slug } });

  if (cached !== null && hasStoredDetail(cached)) {
    logger.debug({ slug }, "problem detail served from cache");
    return { row: cached, response: mapProblemRowToDetailResponse(cached) };
  }

  const raw = await fetchQuestionDetailBySlug(slug);
  const normalized = mapQuestionDetailToNormalized(raw);
  const data = toProblemDetailUpsertData(normalized);

  const saved = await prisma.problem.upsert({
    where: { leetcodeId: data.leetcodeId },
    create: data,
    update: {
      title: data.title,
      slug: data.slug,
      difficulty: data.difficulty,
      topics: data.topics,
      isPremium: data.isPremium,
      rawContent: data.rawContent,
      parsedStatement: data.parsedStatement,
      exampleTestcases: data.exampleTestcases,
      constraints: data.constraints,
      hints: data.hints,
    },
  });

  logger.info({ slug: saved.slug, leetcodeId: saved.leetcodeId }, "problem detail synced");

  return { row: saved, response: toProblemDetailResponse(normalized) };
}

/**
 * Today's POTD: LeetCode daily slug → full detail in `problems` → calendar row in `daily_potd`.
 *
 * Triggered by `GET /api/v1/daily-problem` (run once per morning after LC releases; upsert prevents dupes).
 * Later: replace with a cron job calling the same function at ~00:02 US — no schema change needed.
 */
export async function getTodayDailyProblem(): Promise<ProblemDetailResponse> {
  const dailyRaw = await fetchDailyQuestionRaw();
  const summary = mapDailyQuestionToNormalized(dailyRaw);

  const { row, response } = await syncProblemBySlug(summary.slug);

  await upsertDailyPotdSlot({
    challengeDateRaw: dailyRaw.date,
    problemId: row.id,
  });

  logger.info(
    { leetcodeId: summary.leetcodeId, slug: summary.slug, date: dailyRaw.date },
    "daily POTD sync complete",
  );

  return response;
}

/** Full problem by slug: DB cache first, then LeetCode detail fetch + upsert. */
export async function getProblemBySlug(slug: string): Promise<ProblemDetailResponse> {
  const { response } = await syncProblemBySlug(slug);
  return response;
}
