import type { Problem } from "@prisma/client";
import { DifficultyLevel, Prisma } from "@prisma/client";
import { ApiError } from "../../utils/ApiError.js";
import {
  extractConstraintsFromHtml,
  extractExamplesFromHtml,
  extractStatementFromHtml,
  filterQualityExamples,
  parseExamples,
  resolveProblemExamples,
} from "./leetcode.parser.js";
import type {
  LeetcodeDailyQuestionPayload,
  LeetcodeQuestionDetailPayload,
  LeetcodeQuestionSummary,
  NormalizedDailyProblem,
  NormalizedProblemDetail,
  ProblemDetailResponse,
  ProblemExample,
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
  const examples = resolveProblemExamples({
    html: rawContent,
    exampleTestcases: payload.exampleTestcases,
    exampleTestcaseList: payload.exampleTestcaseList,
  });
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
    examples: normalized.examples as Prisma.InputJsonValue,
    constraints: normalized.constraints,
    hints: normalized.hints,
  };
}

function formatExampleValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  return JSON.stringify(v);
}

function formatStructuredExampleInput(input: Record<string, unknown>): string {
  return Object.entries(input)
    .map(([key, val]) => `${key} = ${formatExampleValue(val)}`)
    .join("\n");
}

function isStructuredExampleRaw(item: unknown): boolean {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    return false;
  }
  const input = (item as Record<string, unknown>)["input"];
  return input !== null && typeof input === "object" && !Array.isArray(input);
}

function normalizeStoredExample(item: unknown): ProblemExample | null {
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    return null;
  }
  const o = item as Record<string, unknown>;

  let inputStr = "";
  if (typeof o["input"] === "string") {
    inputStr = o["input"];
  } else if (o["input"] !== null && typeof o["input"] === "object" && !Array.isArray(o["input"])) {
    inputStr = formatStructuredExampleInput(o["input"] as Record<string, unknown>);
  } else if (o["input"] !== undefined) {
    inputStr = formatExampleValue(o["input"]);
  } else {
    return null;
  }

  if (o["output"] === undefined || o["output"] === null) {
    return null;
  }

  const outputStr = formatExampleValue(o["output"]);
  const explanation =
    typeof o["explanation"] === "string"
      ? o["explanation"]
      : o["explanation"] !== undefined && o["explanation"] !== null
        ? formatExampleValue(o["explanation"])
        : "";

  return { input: inputStr, output: outputStr, explanation };
}

/** Read persisted JSON examples from a DB row (string or structured object input/output). */
export function readStoredExamples(row: Problem): ProblemExample[] | null {
  const raw = row.examples;
  if (raw === null || raw === undefined || !Array.isArray(raw)) {
    return null;
  }
  const structuredItems = raw.filter(isStructuredExampleRaw);
  const source = structuredItems.length > 0 ? structuredItems : raw;
  const out: ProblemExample[] = [];
  for (const item of source) {
    const normalized = normalizeStoredExample(item);
    if (normalized !== null) {
      out.push(normalized);
    }
  }
  return out.length > 0 ? out : null;
}

export function hasStoredExamples(row: Problem): boolean {
  return readStoredExamples(row) !== null;
}

export function hasCompleteStoredExamples(row: Problem): boolean {
  const stored = readStoredExamples(row);
  return filterQualityExamples(stored ?? []).length > 0;
}

function resolveExamplesForProblemRow(row: Problem): ProblemExample[] {
  const stored = readStoredExamples(row);
  const storedQuality = filterQualityExamples(stored ?? []);
  if (storedQuality.length > 0) {
    return storedQuality;
  }

  if (row.rawContent !== null && row.rawContent.trim().length > 0) {
    const fromHtml = filterQualityExamples(extractExamplesFromHtml(row.rawContent));
    if (fromHtml.length > 0) {
      return fromHtml;
    }
  }

  const parsed = filterQualityExamples(parseExamples(row.exampleTestcases, null));
  if (parsed.length > 0) {
    return parsed;
  }

  return storedQuality;
}

/** Rebuild API response from a DB row (persisted examples, else re-parse testcase string). */
export function mapProblemRowToDetailResponse(row: Problem): ProblemDetailResponse {
  const examples = resolveExamplesForProblemRow(row);
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
