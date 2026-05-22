import type { Problem } from "@prisma/client";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { upsertDailyPotdSlot } from "./dailyPotd.service.js";
import { fetchDailyQuestionRaw, fetchQuestionDetailBySlug } from "./leetcode.client.js";
import {
  hasStoredDetail,
  hasCompleteStoredExamples,
  mapDailyQuestionToNormalized,
  mapProblemRowToDetailResponse,
  mapQuestionDetailToNormalized,
  readStoredExamples,
  toProblemDetailResponse,
  toProblemDetailUpsertData,
} from "./leetcode.mapper.js";
import { enrichExamplesWithJudgeTestcases, filterQualityExamples } from "./leetcode.parser.js";
import type { ProblemDetailResponse } from "./leetcode.types.js";

/**
 * Sync full problem row + API DTO. Returns DB row so callers can link calendar tables (e.g. `daily_potd`).
 */
export async function syncProblemBySlug(slug: string): Promise<{
  row: Problem;
  response: ProblemDetailResponse;
}> {
  const cached = await prisma.problem.findUnique({ where: { slug } });

  if (cached !== null && hasStoredDetail(cached) && hasCompleteStoredExamples(cached)) {
    logger.debug({ slug }, "problem detail served from cache");
    const response = await attachVisibleTestcaseExamples(cached, mapProblemRowToDetailResponse(cached));
    if (response.examples.length > 0) {
      return { row: cached, response };
    }
    logger.info({ slug }, "cached examples empty after quality filter — re-syncing from LeetCode");
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
      examples: data.examples,
      constraints: data.constraints,
      hints: data.hints,
    },
  });

  logger.info({ slug: saved.slug, leetcodeId: saved.leetcodeId }, "problem detail synced");

  const response = await attachVisibleTestcaseExamples(saved, toProblemDetailResponse(normalized));
  return { row: saved, response };
}

async function attachVisibleTestcaseExamples(
  row: Problem,
  response: ProblemDetailResponse,
): Promise<ProblemDetailResponse> {
  const fromDb = filterQualityExamples(readStoredExamples(row) ?? []);
  if (fromDb.length > 0) {
    return { ...response, examples: fromDb };
  }

  const testcases = await prisma.problemTestcase.findMany({
    where: { problemId: row.id, isHidden: false },
    orderBy: { orderIndex: "asc" },
    select: { input: true, expectedOutput: true },
  });
  if (testcases.length === 0) {
    return { ...response, examples: filterQualityExamples(response.examples) };
  }

  const base = filterQualityExamples(response.examples);
  if (base.length > 0) {
    return {
      ...response,
      examples: enrichExamplesWithJudgeTestcases(base, testcases.slice(0, base.length)),
    };
  }
  return {
    ...response,
    examples: enrichExamplesWithJudgeTestcases([], testcases),
  };
}

/**
 * Today's POTD: LeetCode daily slug → full detail in `problems` → calendar row in `daily_potd`.
 *
 * Used by `GET /api/v1/daily-problem`, `npm run sync:daily-potd`, and the daily POTD cron job.
 * Upserts are idempotent — safe to run multiple times per day.
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
