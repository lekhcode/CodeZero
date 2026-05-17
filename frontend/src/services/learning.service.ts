import type {
  TrackedDueResponse,
  TrackedHistoryResponse,
  TrackedTodayResponse,
} from "@/types/api.types";
import { api, unwrap } from "./api";

export const learningService = {
  getTodayAssignments() {
    return unwrap<TrackedTodayResponse>(api.get("/api/v1/users/me/assignments/today"));
  },

  getDueAssignments() {
    return unwrap<TrackedDueResponse>(api.get("/api/v1/users/me/assignments/due"));
  },

  getAssignmentHistory(params?: { page?: number; limit?: number }) {
    return unwrap<TrackedHistoryResponse>(
      api.get("/api/v1/users/me/assignments/history", { params }),
    );
  },
};
