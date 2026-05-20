import type { DifficultyLevel, Problem } from "@prisma/client";

export type TemplateProblemRow = {
  order: number;
  problem: Problem;
};

/** UTC midnight for calendar-day math (assignment days, POTD dates). */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Days since enrollment (0 = first day). Negative values clamp to 0 (future-dated rows).
 */
export function computePlanDayIndex(enrolledAt: Date, referenceDate: Date = new Date()): number {
  const enrolledDay = startOfUtcDay(enrolledAt);
  const today = startOfUtcDay(referenceDate);
  const dayMs = 24 * 60 * 60 * 1000;
  const raw = Math.floor((today.getTime() - enrolledDay.getTime()) / dayMs);
  return raw < 0 ? 0 : raw;
}

function matchesDifficulty(
  problemDifficulty: DifficultyLevel,
  filter: DifficultyLevel | null,
): boolean {
  if (filter === null || filter === "MIXED") {
    return true;
  }
  return problemDifficulty === filter;
}

export function filterPlanProblemsByDifficulty(
  rows: TemplateProblemRow[],
  difficulty: DifficultyLevel | null,
  difficultyFilters: DifficultyLevel[] = [],
): TemplateProblemRow[] {
  if (difficultyFilters.length > 0) {
    const allowed = new Set(difficultyFilters);
    return rows.filter((row) => allowed.has(row.problem.difficulty));
  }
  return rows.filter((row) => matchesDifficulty(row.problem.difficulty, difficulty));
}

export type StudyPlanSliceResult = {
  dayIndex: number;
  dailyCount: number;
  totalInPlan: number;
  /** Problems assigned for this calendar day (may be shorter than `dailyCount` on last day). */
  assigned: TemplateProblemRow[];
};

/**
 * Picks the next `dailyCount` problems in plan order for calendar day `dayIndex`.
 * Day 0 → orders [1..dailyCount], day 1 → next window, etc.
 */
export function sliceStudyPlanForDay(params: {
  rows: TemplateProblemRow[];
  dayIndex: number;
  dailyCount: number;
}): StudyPlanSliceResult {
  const { rows, dayIndex, dailyCount } = params;
  const totalInPlan = rows.length;
  const start = dayIndex * dailyCount;
  const assigned = rows.slice(start, start + dailyCount);

  return {
    dayIndex,
    dailyCount,
    totalInPlan,
    assigned,
  };
}
