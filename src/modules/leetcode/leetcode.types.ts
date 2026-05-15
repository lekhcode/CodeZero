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

export type LeetcodeGraphqlResponse = {
  data?: {
    activeDailyCodingChallengeQuestion?: LeetcodeDailyQuestionPayload | null;
    question?: LeetcodeQuestionDetailPayload | null;
  };
  errors?: Array<{ message: string }>;
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
