import type { LearningInsights } from "@/types/api.types";
import { api, unwrap } from "./api";

export const insightsService = {
  getLearningInsights() {
    return unwrap<LearningInsights>(api.get("/api/v1/users/me/learning-insights"));
  },
};
