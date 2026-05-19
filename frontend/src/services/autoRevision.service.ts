import type {
  AutoRevisionMonthResponse,
  AutoRevisionSummary,
  AutoRevisionTodayGrouped,
  AutoRevisionWeekResponse,
} from "@/types/autoRevision.types";
import { api, unwrap } from "./api";
import { getClientTimezone } from "@/utils/timezone";

function tzParams(timezone?: string) {
  return { timezone: timezone ?? getClientTimezone() };
}

export const autoRevisionService = {
  today(timezone?: string) {
    return unwrap<AutoRevisionTodayGrouped>(
      api.get("/api/v1/auto-revisions/today", { params: tzParams(timezone) }),
    );
  },

  week(weekOffset = 0, timezone?: string) {
    return unwrap<AutoRevisionWeekResponse>(
      api.get("/api/v1/auto-revisions/week", {
        params: { weekOffset, ...tzParams(timezone) },
      }),
    );
  },

  month(monthOffset = 0, timezone?: string) {
    return unwrap<AutoRevisionMonthResponse>(
      api.get("/api/v1/auto-revisions/month", {
        params: { monthOffset, ...tzParams(timezone) },
      }),
    );
  },

  summary(timezone?: string) {
    return unwrap<AutoRevisionSummary>(
      api.get("/api/v1/auto-revisions/summary", { params: tzParams(timezone) }),
    );
  },

  markRevised(id: string) {
    return unwrap<{ revision: unknown }>(api.patch(`/api/v1/auto-revisions/${id}/mark-revised`));
  },
};
