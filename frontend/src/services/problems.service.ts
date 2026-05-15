import type { ProblemDetail } from "@/types/api.types";
import { api, unwrap } from "./api";

export const problemsService = {
  getBySlug(slug: string) {
    return unwrap<ProblemDetail>(api.get(`/api/v1/problems/${slug}`));
  },

  getDailyProblem() {
    return unwrap<ProblemDetail>(api.get("/api/v1/daily-problem"));
  },
};
