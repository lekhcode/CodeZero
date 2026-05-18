import { type DifficultyLevel, ScheduleType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { findTodayDailyPotdSlot } from "../leetcode/dailyPotd.service.js";
import { mapProblemRowToDetailResponse } from "../leetcode/leetcode.mapper.js";
import type { TodayAssignmentItem, TodayAssignmentsResponse } from "./assignments.types.js";
import {
  computePlanDayIndex,
  filterPlanProblemsByDifficulty,
  sliceStudyPlanForDay,
  type TemplateProblemRow,
} from "./studyPlanAssignment.js";

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function groupTemplateProblems(
  rows: Array<{
    templateId: string;
    order: number;
    problem: TemplateProblemRow["problem"];
  }>,
): Map<string, TemplateProblemRow[]> {
  const map = new Map<string, TemplateProblemRow[]>();
  for (const row of rows) {
    const list = map.get(row.templateId) ?? [];
    list.push({ order: row.order, problem: row.problem });
    map.set(row.templateId, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.order - b.order);
  }
  return map;
}

function buildStudyPlanAssignment(
  schedule: {
    id: string;
    createdAt: Date;
    dailyQuestions: number | null;
    difficulty: DifficultyLevel | null;
    template: {
      slug: string;
      name: string;
      type: ScheduleType;
      defaultCount: number | null;
    };
    templateId: string;
  },
  planRows: TemplateProblemRow[],
): TodayAssignmentItem {
  const base = {
    userScheduleId: schedule.id,
    templateSlug: schedule.template.slug,
    templateName: schedule.template.name,
    scheduleType: schedule.template.type,
  };

  const dailyCount = schedule.dailyQuestions ?? schedule.template.defaultCount ?? 1;
  const dayIndex = computePlanDayIndex(schedule.createdAt);
  const filtered = filterPlanProblemsByDifficulty(planRows, schedule.difficulty);
  const slice = sliceStudyPlanForDay({
    rows: filtered,
    dayIndex,
    dailyCount,
  });

  const planProgress = {
    dayIndex: slice.dayIndex,
    dailyCount: slice.dailyCount,
    assignedOrders: slice.assigned.map((row) => row.order),
    totalInPlan: slice.totalInPlan,
  };

  if (slice.totalInPlan === 0) {
    return {
      ...base,
      problems: [],
      status: "unavailable",
      planProgress,
    };
  }

  const windowStart = slice.dayIndex * slice.dailyCount;
  if (windowStart >= slice.totalInPlan) {
    return {
      ...base,
      problems: [],
      status: "completed",
      planProgress,
    };
  }

  if (slice.assigned.length === 0) {
    return {
      ...base,
      problems: [],
      status: "unavailable",
      planProgress,
    };
  }

  return {
    ...base,
    problems: slice.assigned.map((row) => mapProblemRowToDetailResponse(row.problem)),
    status: "ready",
    planProgress,
  };
}

/**
 * Resolves today's practice items from active `user_schedules`.
 *
 * - DAILY_POTD → one problem from `daily_potd` (after `/daily-problem` sync).
 * - STUDY_PLAN → next N problems in template order (N = `dailyQuestions`).
 * - TOPIC → not implemented yet (`pending`).
 */
export async function getTodayAssignmentsForUser(userId: string): Promise<TodayAssignmentsResponse> {
  const activeSchedules = await prisma.userSchedule.findMany({
    where: { userId, active: true },
    include: {
      template: {
        select: {
          id: true,
          slug: true,
          name: true,
          type: true,
          defaultCount: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const studyPlanTemplateIds = activeSchedules
    .filter((s) => s.template.type === ScheduleType.STUDY_PLAN)
    .map((s) => s.template.id);

  const templateProblemRows =
    studyPlanTemplateIds.length === 0
      ? []
      : await prisma.templateProblem.findMany({
          where: { templateId: { in: studyPlanTemplateIds } },
          orderBy: { order: "asc" },
          include: { problem: true },
        });

  const problemsByTemplateId = groupTemplateProblems(templateProblemRows);

  const needsPotd = activeSchedules.some((s) => s.template.type === ScheduleType.DAILY_POTD);
  const potdSlot = needsPotd ? await findTodayDailyPotdSlot() : null;

  const assignments: TodayAssignmentItem[] = activeSchedules.map((schedule) => {
    const base = {
      userScheduleId: schedule.id,
      templateSlug: schedule.template.slug,
      templateName: schedule.template.name,
      scheduleType: schedule.template.type,
    };

    if (schedule.template.type === ScheduleType.DAILY_POTD) {
      if (potdSlot === null || potdSlot.problem === null) {
        return {
          ...base,
          problems: [],
          status: "unavailable" as const,
        };
      }
      return {
        ...base,
        problems: [mapProblemRowToDetailResponse(potdSlot.problem)],
        status: "ready" as const,
        challengeDate: formatDateOnly(potdSlot.challengeDate),
      };
    }

    if (schedule.template.type === ScheduleType.STUDY_PLAN) {
      const planRows = problemsByTemplateId.get(schedule.template.id) ?? [];
      return buildStudyPlanAssignment(
        {
          id: schedule.id,
          createdAt: schedule.createdAt,
          dailyQuestions: schedule.dailyQuestions,
          difficulty: schedule.difficulty,
          templateId: schedule.template.id,
          template: schedule.template,
        },
        planRows,
      );
    }

    return {
      ...base,
      problems: [],
      status: "pending" as const,
    };
  });

  return { assignments };
}
