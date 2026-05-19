import { api, unwrap } from "@/services/api";
import type { DueCalendarDayResponse, DueCalendarSummaryResponse } from "./due-calendar.types";

export const dueCalendarApi = {
  getSummary(from: string, to: string) {
    return unwrap<DueCalendarSummaryResponse>(
      api.get("/api/v1/due-calendar/summary", { params: { from, to } }),
    );
  },

  getDay(date: string) {
    return unwrap<DueCalendarDayResponse>(api.get("/api/v1/due-calendar/day", { params: { date } }));
  },
};
