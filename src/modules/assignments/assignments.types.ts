import type { ScheduleType } from "@prisma/client";
import type { ProblemDetailResponse } from "../leetcode/leetcode.types.js";

/** Progress metadata for sequential study plans (Blind 75, Top Interview 150). */
export type StudyPlanProgress = {
  dayIndex: number;
  dailyCount: number;
  /** 1-based `order` values in the template for today's slice. */
  assignedOrders: number[];
  totalInPlan: number;
};

/** One row per active user schedule resolved for "today". */
export type TodayAssignmentItem = {
  userScheduleId: string;
  templateSlug: string;
  templateName: string;
  scheduleType: ScheduleType;
  problems: ProblemDetailResponse[];
  status: "ready" | "pending" | "unavailable" | "completed";
  /** LeetCode POTD challenge date (YYYY-MM-DD) when applicable. */
  challengeDate?: string;
  planProgress?: StudyPlanProgress;
};

export type TodayAssignmentsResponse = {
  assignments: TodayAssignmentItem[];
};
