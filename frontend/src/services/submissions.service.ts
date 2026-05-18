import type {
  SolvedDifficultyStats,
  SubmissionActivitySummary,
  SubmissionDetailResponse,
  SubmissionStatus,
  SubmissionsListResponse,
} from "@/types/api.types";
import { api, unwrap } from "./api";

export type ListSubmissionsParams = {
  page?: number;
  limit?: number;
  verdict?: SubmissionStatus;
  language?: string;
  problemSlug?: string;
};

export const submissionsService = {
  getSolvedStats() {
    return unwrap<SolvedDifficultyStats>(api.get("/api/v1/submissions/solved-stats"));
  },

  getActivity(params?: { year?: number; rolling?: boolean }) {
    return unwrap<SubmissionActivitySummary>(
      api.get("/api/v1/submissions/activity", {
        params:
          params?.rolling === true || params?.year === undefined
            ? {}
            : { year: params.year },
      }),
    );
  },

  list(params?: ListSubmissionsParams) {
    return unwrap<SubmissionsListResponse>(api.get("/api/v1/submissions", { params }));
  },

  getById(id: string) {
    return unwrap<SubmissionDetailResponse>(api.get(`/api/v1/submissions/${id}`));
  },
};
