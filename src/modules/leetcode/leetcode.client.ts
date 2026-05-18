import { logger } from "../../config/logger.js";
import { ApiError } from "../../utils/ApiError.js";
import type {
  LeetcodeDailyQuestionPayload,
  LeetcodeGraphqlResponse,
  LeetcodeProblemListItem,
  LeetcodeProblemListPage,
  LeetcodeQuestionDetailPayload,
} from "./leetcode.types.js";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const FETCH_TIMEOUT_MS = 15_000;

const QUESTION_OF_TODAY_QUERY = `
  query questionOfToday {
    activeDailyCodingChallengeQuestion {
      date
      link
      question {
        questionFrontendId
        title
        titleSlug
        difficulty
        isPaidOnly
        topicTags {
          name
        }
      }
    }
  }
`;

const QUESTION_DETAIL_QUERY = `
  query questionDetail($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionFrontendId
      title
      titleSlug
      difficulty
      isPaidOnly
      content
      exampleTestcases
      exampleTestcaseList
      topicTags {
        name
      }
      hints
    }
  }
`;

async function executeGraphql<T>(params: {
  query: string;
  operationName: string;
  variables?: Record<string, unknown>;
  extract: (data: NonNullable<LeetcodeGraphqlResponse["data"]>) => T;
  emptyMessage: string;
  errorCode: string;
}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: params.query,
        operationName: params.operationName,
        variables: params.variables,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn({ status: response.status, operation: params.operationName }, "leetcode graphql non-2xx");
      throw new ApiError(502, "Failed to fetch from LeetCode", { code: "LEETCODE_UPSTREAM_ERROR" });
    }

    const json = (await response.json()) as LeetcodeGraphqlResponse;

    if (json.errors !== undefined && json.errors.length > 0) {
      logger.warn({ errors: json.errors, operation: params.operationName }, "leetcode graphql errors");
      throw new ApiError(502, "LeetCode returned GraphQL errors", { code: "LEETCODE_GRAPHQL_ERROR" });
    }

    if (json.data === undefined) {
      throw new ApiError(502, params.emptyMessage, { code: params.errorCode });
    }

    return params.extract(json.data);
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(504, "LeetCode request timed out", { code: "LEETCODE_TIMEOUT" });
    }
    logger.error({ err, operation: params.operationName }, "leetcode fetch failed");
    throw new ApiError(502, "Failed to fetch from LeetCode", {
      code: "LEETCODE_UPSTREAM_ERROR",
      cause: err,
    });
  } finally {
    clearTimeout(timeout);
  }
}

const PROBLEM_LIST_QUERY = `
  query problemsetQuestionList(
    $categorySlug: String
    $limit: Int
    $skip: Int
    $filters: QuestionListFilterInput
  ) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      totalNum
      questions: data {
        questionFrontendId
        title
        titleSlug
        difficulty
        isPaidOnly
        topicTags {
          name
        }
      }
    }
  }
`;

export type ProblemListFilters = {
  premiumOnly?: boolean;
};

function normalizeListItem(raw: Record<string, unknown>): LeetcodeProblemListItem | null {
  const questionFrontendId =
    typeof raw["questionFrontendId"] === "string"
      ? raw["questionFrontendId"]
      : typeof raw["frontendQuestionId"] === "string"
        ? raw["frontendQuestionId"]
        : null;
  const titleSlug = typeof raw["titleSlug"] === "string" ? raw["titleSlug"] : null;
  const title = typeof raw["title"] === "string" ? raw["title"] : null;
  const difficulty = typeof raw["difficulty"] === "string" ? raw["difficulty"] : null;
  const isPaidOnly =
    typeof raw["isPaidOnly"] === "boolean"
      ? raw["isPaidOnly"]
      : typeof raw["paidOnly"] === "boolean"
        ? raw["paidOnly"]
        : false;

  if (
    questionFrontendId === null ||
    titleSlug === null ||
    title === null ||
    difficulty === null
  ) {
    return null;
  }

  const topicTagsRaw = raw["topicTags"];
  const topicTags = Array.isArray(topicTagsRaw)
    ? topicTagsRaw
        .map((t) => {
          if (t === null || typeof t !== "object") return null;
          const name = (t as Record<string, unknown>)["name"];
          return typeof name === "string" ? { name } : null;
        })
        .filter((t): t is { name: string } => t !== null)
    : [];

  return {
    questionFrontendId,
    title,
    titleSlug,
    difficulty,
    isPaidOnly,
    topicTags,
  };
}

/** One page of the public problem catalog (metadata only). */
export async function fetchProblemListPage(params: {
  skip: number;
  limit: number;
  filters?: ProblemListFilters;
}): Promise<LeetcodeProblemListPage> {
  const filters =
    params.filters?.premiumOnly !== undefined
      ? { premiumOnly: params.filters.premiumOnly }
      : undefined;

  return executeGraphql({
    query: PROBLEM_LIST_QUERY,
    operationName: "problemsetQuestionList",
    variables: {
      categorySlug: "",
      limit: params.limit,
      skip: params.skip,
      filters,
    },
    emptyMessage: "No problem list returned from LeetCode",
    errorCode: "LEETCODE_LIST_EMPTY",
    extract: (data) => {
      const page = data.problemsetQuestionList ?? null;
      if (page === null || page.questions === undefined) {
        throw new ApiError(502, "No problem list returned from LeetCode", {
          code: "LEETCODE_LIST_EMPTY",
        });
      }

      const questions: LeetcodeProblemListItem[] = [];
      for (const item of page.questions) {
        if (item === null || typeof item !== "object") {
          continue;
        }
        const normalized = normalizeListItem(item as Record<string, unknown>);
        if (normalized !== null) {
          questions.push(normalized);
        }
      }

      return {
        totalNum: typeof page.totalNum === "number" ? page.totalNum : questions.length,
        questions,
      };
    },
  });
}

/** Today's active daily challenge (metadata only). */
export async function fetchDailyQuestionRaw(): Promise<LeetcodeDailyQuestionPayload> {
  return executeGraphql({
    query: QUESTION_OF_TODAY_QUERY,
    operationName: "questionOfToday",
    emptyMessage: "No daily problem available from LeetCode",
    errorCode: "LEETCODE_NO_DAILY",
    extract: (data) => {
      const daily = data.activeDailyCodingChallengeQuestion ?? null;
      if (daily === null || daily.question === null || daily.question === undefined) {
        throw new ApiError(502, "No daily problem available from LeetCode", {
          code: "LEETCODE_NO_DAILY",
        });
      }
      return daily;
    },
  });
}

/** Full question detail by slug (HTML content + testcases + hints). */
export async function fetchQuestionDetailBySlug(slug: string): Promise<LeetcodeQuestionDetailPayload> {
  return executeGraphql({
    query: QUESTION_DETAIL_QUERY,
    operationName: "questionDetail",
    variables: { titleSlug: slug },
    emptyMessage: "Question not found on LeetCode",
    errorCode: "LEETCODE_NOT_FOUND",
    extract: (data) => {
      const question = data.question ?? null;
      if (question === null || question.content === null || question.content === undefined) {
        throw new ApiError(404, "Question not found on LeetCode", { code: "LEETCODE_NOT_FOUND" });
      }
      return question;
    },
  });
}
