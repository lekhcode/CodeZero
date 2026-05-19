import { z } from "zod";

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const dueCalendarSummaryQuerySchema = z.object({
  from: dateKeySchema,
  to: dateKeySchema,
});

export const dueCalendarDayQuerySchema = z.object({
  date: dateKeySchema,
});

export type DueCalendarSummaryQuery = z.infer<typeof dueCalendarSummaryQuerySchema>;
export type DueCalendarDayQuery = z.infer<typeof dueCalendarDayQuerySchema>;
