import type {
  ProblemCatalogFilters,
  ProblemCatalogPage,
  ProblemCatalogStats,
  ProblemDetail,
  ProblemTopicTag,
} from "@/types/api.types";
import { api, unwrap } from "./api";

function buildCatalogParams(filters: ProblemCatalogFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.page !== undefined) params.page = String(filters.page);
  if (filters.limit !== undefined) params.limit = String(filters.limit);
  if (filters.search !== undefined && filters.search.trim().length > 0) {
    params.search = filters.search.trim();
  }
  if (filters.difficulty !== undefined && filters.difficulty.length > 0) {
    params.difficulty = filters.difficulty.join(",");
  }
  if (filters.topics !== undefined && filters.topics.length > 0) {
    params.topics = filters.topics.join(",");
  }
  if (filters.includePremium === true) {
    params.includePremium = "true";
  }
  if (filters.shuffle === true) {
    params.shuffle = "true";
  }
  return params;
}

export const problemsService = {
  list(filters: ProblemCatalogFilters = {}) {
    return unwrap<ProblemCatalogPage>(
      api.get("/api/v1/problems", { params: buildCatalogParams(filters) }),
    );
  },

  getCatalogStats(includePremium = false) {
    return unwrap<ProblemCatalogStats>(
      api.get("/api/v1/problems/stats", {
        params: includePremium ? { includePremium: "true" } : {},
      }),
    );
  },

  listTopicTags(includePremium = false) {
    return unwrap<{ topicTags: ProblemTopicTag[] }>(
      api.get("/api/v1/problems/topics", {
        params: includePremium ? { includePremium: "true" } : {},
      }),
    );
  },

  getBySlug(slug: string) {
    return unwrap<ProblemDetail>(api.get(`/api/v1/problems/${slug}`));
  },

  getDailyProblem() {
    return unwrap<ProblemDetail>(api.get("/api/v1/daily-problem"));
  },
};
