import type { Problem } from "@prisma/client";
import { DifficultyLevel } from "@prisma/client";
import { ApiError } from "../../utils/ApiError.js";
import {
  extractConstraintsFromHtml,
  extractStatementFromHtml,
  parseExamples,
} from "./leetcode.parser.js";
import type {
  LeetcodeDailyQuestionPayload,
  LeetcodeQuestionDetailPayload,
  LeetcodeQuestionSummary,
  NormalizedDailyProblem,
  NormalizedProblemDetail,
  ProblemDetailResponse,
} from "./leetcode.types.js";

const LC_DIFFICULTY_TO_ENUM: Record<string, DifficultyLevel> = {
  Easy: DifficultyLevel.EASY,
  Medium: DifficultyLevel.MEDIUM,
  Hard: DifficultyLevel.HARD,
};

function parseDifficulty(raw: string): DifficultyLevel {
  const difficultyEnum = LC_DIFFICULTY_TO_ENUM[raw];
  if (difficultyEnum === undefined) {
    throw new ApiError(502, `Unknown difficulty from LeetCode: ${raw}`, {
      code: "LEETCODE_INVALID_PAYLOAD",
    });
  }
  return difficultyEnum;
}

function parseLeetcodeId(questionFrontendId: string): number {
  const leetcodeId = Number.parseInt(questionFrontendId, 10);
  if (!Number.isFinite(leetcodeId)) {
    throw new ApiError(502, "Invalid question id from LeetCode", {
      code: "LEETCODE_INVALID_PAYLOAD",
    });
  }
  return leetcodeId;
}

function mapSummaryToBase(summary: LeetcodeQuestionSummary): NormalizedDailyProblem {
  return {
    leetcodeId: parseLeetcodeId(summary.questionFrontendId),
    title: summary.title.trim(),
    slug: summary.titleSlug.trim(),
    difficulty: parseDifficulty(summary.difficulty),
    topics: summary.topicTags.map((t) => t.name).filter((name) => name.length > 0),
    isPremium: summary.isPaidOnly,
  };
}

export function mapDailyQuestionToNormalized(
  payload: LeetcodeDailyQuestionPayload,
): NormalizedDailyProblem {
  return mapSummaryToBase(payload.question);
}

/**
 * LeetCode detail payload → normalized internal shape (includes parsed text, not raw GraphQL).
 */
export function mapQuestionDetailToNormalized(
  payload: LeetcodeQuestionDetailPayload,
): NormalizedProblemDetail {
  const base = mapSummaryToBase(payload);
  const rawContent = payload.content;
  const parsedStatement = extractStatementFromHtml(rawContent);
  const constraints = extractConstraintsFromHtml(rawContent);
  const examples = parseExamples(payload.exampleTestcases, payload.exampleTestcaseList);
  const hints = (payload.hints ?? []).filter((h) => h !== null && h.trim().length > 0);

  return {
    ...base,
    rawContent,
    parsedStatement,
    exampleTestcases: payload.exampleTestcases,
    constraints,
    hints,
    examples,
  };
}

export function toProblemDetailResponse(
  normalized: Pick<
    NormalizedProblemDetail,
    "title" | "slug" | "difficulty" | "topics" | "isPremium" | "parsedStatement" | "examples" | "constraints"
  >,
): ProblemDetailResponse {
  return {
    title: normalized.title,
    slug: normalized.slug,
    difficulty: normalized.difficulty,
    topics: normalized.topics,
    statement: normalized.parsedStatement,
    examples: normalized.examples,
    constraints: normalized.constraints,
    isPremium: normalized.isPremium,
  };
}

/** Prisma upsert input for metadata-only sync (POTD). */
export function toProblemUpsertData(normalized: NormalizedDailyProblem) {
  return {
    leetcodeId: normalized.leetcodeId,
    title: normalized.title,
    slug: normalized.slug,
    difficulty: normalized.difficulty,
    topics: normalized.topics,
    isPremium: normalized.isPremium,
  };
}

/** Prisma upsert input including parsed detail fields. */
export function toProblemDetailUpsertData(normalized: NormalizedProblemDetail) {
  return {
    ...toProblemUpsertData(normalized),
    rawContent: normalized.rawContent,
    parsedStatement: normalized.parsedStatement,
    exampleTestcases: normalized.exampleTestcases,
    constraints: normalized.constraints,
    hints: normalized.hints,
  };
}

/** Rebuild API response from a DB row (re-parses examples from stored testcase string). */
export function mapProblemRowToDetailResponse(row: Problem): ProblemDetailResponse {
  const examples = parseExamples(row.exampleTestcases, null);
  return {
    title: row.title,
    slug: row.slug,
    difficulty: row.difficulty,
    topics: row.topics,
    statement: row.parsedStatement ?? "",
    examples,
    constraints: row.constraints,
    isPremium: row.isPremium,
  };
}

export function hasStoredDetail(row: Problem): boolean {
  return row.parsedStatement !== null && row.parsedStatement.trim().length > 0;
}
