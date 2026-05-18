import type { Problem } from "@prisma/client";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { fetchProblemListPage } from "./leetcode.client.js";
import {
  hasCompleteStoredExamples,
  hasStoredDetail,
  mapSummaryToBase,
  toProblemUpsertData,
} from "./leetcode.mapper.js";
import { syncProblemBySlug } from "./leetcode.service.js";
import type { CatalogDumpResult, DetailsDumpResult, LeetcodeQuestionSummary } from "./leetcode.types.js";
import type { DumpCatalogBody, DumpDetailsBody } from "./leetcode.dump.validation.js";

const PAGE_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function metadataMatches(row: Problem, data: ReturnType<typeof toProblemUpsertData>): boolean {
  return (
    row.title === data.title &&
    row.slug === data.slug &&
    row.difficulty === data.difficulty &&
    row.isPremium === data.isPremium &&
    row.topics.length === data.topics.length &&
    row.topics.every((t, i) => t === data.topics[i])
  );
}

async function upsertCatalogRow(
  summary: LeetcodeQuestionSummary,
): Promise<"created" | "updated" | "unchanged"> {
  const normalized = mapSummaryToBase(summary);
  const data = toProblemUpsertData(normalized);

  const existing = await prisma.problem.findUnique({
    where: { leetcodeId: data.leetcodeId },
  });

  if (existing === null) {
    await prisma.problem.create({ data });
    return "created";
  }

  if (metadataMatches(existing, data)) {
    return "unchanged";
  }

  await prisma.problem.update({
    where: { leetcodeId: data.leetcodeId },
    data: {
      title: data.title,
      slug: data.slug,
      difficulty: data.difficulty,
      topics: data.topics,
      isPremium: data.isPremium,
    },
  });
  return "updated";
}

export async function dumpCatalog(body: DumpCatalogBody): Promise<CatalogDumpResult> {
  const started = Date.now();
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let skip = 0;
  let totalFromLeetcode = 0;

  let pageSkip = 0;
  let totalNum = Number.POSITIVE_INFINITY;

  while (pageSkip < totalNum) {
    const page = await fetchProblemListPage(
      body.nonPremiumOnly
        ? {
            skip: pageSkip,
            limit: body.pageSize,
            filters: { premiumOnly: false },
          }
        : {
            skip: pageSkip,
            limit: body.pageSize,
          },
    );

    totalNum = page.totalNum;
    totalFromLeetcode = totalNum;

    if (page.questions.length === 0) {
      break;
    }

    for (const item of page.questions) {
      if (body.nonPremiumOnly && item.isPaidOnly) {
        skip += 1;
        continue;
      }

      const outcome = await upsertCatalogRow(item);
      if (outcome === "created") created += 1;
      else if (outcome === "updated") updated += 1;
      else unchanged += 1;
    }

    pageSkip += page.questions.length;
    if (pageSkip < totalNum) {
      await sleep(PAGE_DELAY_MS);
    }
  }

  const durationMs = Date.now() - started;
  logger.info(
    { created, updated, unchanged, skippedPremium: skip, totalFromLeetcode, durationMs },
    "leetcode catalog dump complete",
  );

  return {
    totalFromLeetcode,
    created,
    updated,
    unchanged,
    durationMs,
  };
}

function needsDetailSync(row: Problem, force: boolean): boolean {
  if (force) {
    return true;
  }
  if (row.isPremium) {
    return false;
  }
  return !hasStoredDetail(row) || !hasCompleteStoredExamples(row);
}

export async function dumpDetails(body: DumpDetailsBody): Promise<DetailsDumpResult> {
  const started = Date.now();
  const delayMs = body.delayMs ?? env.LEETCODE_DUMP_DELAY_MS;
  const failures: DetailsDumpResult["failures"] = [];

  const candidates = await prisma.problem.findMany({
    ...(body.nonPremiumOnly ? { where: { isPremium: false } } : {}),
    orderBy: { leetcodeId: "asc" },
    select: {
      id: true,
      slug: true,
      isPremium: true,
      parsedStatement: true,
      examples: true,
      rawContent: true,
      exampleTestcases: true,
      constraints: true,
      hints: true,
      leetcodeId: true,
      title: true,
      difficulty: true,
      topics: true,
      createdAt: true,
    },
  });

  const queue = candidates.filter((row) => needsDetailSync(row, body.force));
  const toProcess = body.limit !== undefined ? queue.slice(0, body.limit) : queue;

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i += 1) {
    const row = toProcess[i];
    if (row === undefined) {
      continue;
    }

    try {
      await syncProblemBySlug(row.slug);
      synced += 1;
      logger.info({ slug: row.slug, index: i + 1, total: toProcess.length }, "leetcode detail synced");
    } catch (err) {
      failed += 1;
      const reason =
        err instanceof ApiError
          ? `${err.code ?? "ERROR"}: ${err.message}`
          : err instanceof Error
            ? err.message
            : "Unknown error";
      failures.push({ slug: row.slug, reason });
      logger.warn({ slug: row.slug, err }, "leetcode detail dump failed");
    }

    if (i < toProcess.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const notStarted = queue.length - toProcess.length;
  const remaining = notStarted + failed;

  const durationMs = Date.now() - started;
  logger.info({ synced, failed, remaining, durationMs }, "leetcode details dump complete");

  return {
    processed: toProcess.length,
    synced,
    skipped: 0,
    failed,
    remaining,
    failures,
    durationMs,
  };
}
