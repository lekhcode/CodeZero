import type { TodayAssignmentsResponse } from "@/types/api.types";
import { api, unwrap } from "./api";

export const assignmentsService = {
  getToday() {
    return unwrap<TodayAssignmentsResponse>(api.get("/api/v1/assignments/today"));
  },
};
