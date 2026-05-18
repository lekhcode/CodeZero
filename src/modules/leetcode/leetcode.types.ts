/**
 * LeetCode integration types.
 *
 * Transport shapes stay in the client layer; normalized shapes cross service/DB/API boundaries.
 * Raw GraphQL JSON is never persisted or returned from HTTP handlers.
 */
import type { DifficultyLevel } from "@prisma/client";

/** Subset of LeetCode GraphQL `activeDailyCodingChallengeQuestion` — not persisted. */
export type LeetcodeDailyQuestionPayload = {
  date: string;
  link: string;
  question: LeetcodeQuestionSummary;
};

/** Summary fields shared by daily + detail queries. */
export type LeetcodeQuestionSummary = {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  isPaidOnly: boolean;
  topicTags: Array<{ name: string }>;
};

/** Full question payload from `question(titleSlug:)` — client layer only. */
export type LeetcodeQuestionDetailPayload = LeetcodeQuestionSummary & {
  content: string;
  exampleTestcases: string | null;
  exampleTestcaseList: string[] | null;
  hints: string[] | null;
};

/** One row from LeetCode `questionList` — client layer only. */
export type LeetcodeProblemListItem = {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  isPaidOnly: boolean;
  topicTags: Array<{ name: string }>;
};

export type LeetcodeProblemListPage = {
  totalNum: number;
  questions: LeetcodeProblemListItem[];
};

export type LeetcodeGraphqlResponse = {
  data?: {
    activeDailyCodingChallengeQuestion?: LeetcodeDailyQuestionPayload | null;
    question?: LeetcodeQuestionDetailPayload | null;
    problemsetQuestionList?: LeetcodeProblemListPage | null;
  };
  errors?: Array<{ message: string }>;
};

export type CatalogDumpResult = {
  totalFromLeetcode: number;
  created: number;
  updated: number;
  unchanged: number;
  durationMs: number;
};

export type DetailsDumpResult = {
  processed: number;
  synced: number;
  skipped: number;
  failed: number;
  remaining: number;
  failures: Array<{ slug: string; reason: string }>;
  durationMs: number;
};

/** Metadata-only normalized row (POTD sync). */
export type NormalizedDailyProblem = {
  leetcodeId: number;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  topics: string[];
  isPremium: boolean;
};

/** Full normalized row including parsed detail (detail sync). */
export type NormalizedProblemDetail = NormalizedDailyProblem & {
  rawContent: string;
  parsedStatement: string;
  exampleTestcases: string | null;
  constraints: string[];
  hints: string[];
  examples: ProblemExample[];
};

export type ProblemExample = {
  input: string;
  output: string;
  explanation: string;
};

/** Public GET /daily-problem and GET /problems/:slug — no raw HTML. */
export type ProblemDetailResponse = {
  title: string;
  slug: string;
  difficulty: string;
  topics: string[];
  statement: string;
  examples: ProblemExample[];
  constraints: string[];
  isPremium: boolean;
};
