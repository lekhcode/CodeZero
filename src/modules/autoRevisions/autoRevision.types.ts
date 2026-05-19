import type { AutoRevisionType, DifficultyLevel } from "@prisma/client";

export type AutoRevisionDto = {
  id: string;
  userId: string;
  problemId: string;
  problemTitle: string;
  difficulty: DifficultyLevel;
  slug: string;
  solvedAt: string;
  revisionType: AutoRevisionType;
  scheduledFor: string;
  isRevised: boolean;
  revisedAt: string | null;
};

export type AutoRevisionGroupedToday = {
  daily: AutoRevisionDto[];
  weekly: AutoRevisionDto[];
  monthly: AutoRevisionDto[];
};

export type AutoRevisionWeekResponse = {
  weekRange: { start: string; end: string; label: string };
  weekOffset: number;
  problems: AutoRevisionDto[];
  totalScheduled: number;
  totalRevised: number;
};

export type AutoRevisionMonthResponse = {
  monthLabel: string;
  monthOffset: number;
  range: { start: string; end: string };
  problems: AutoRevisionDto[];
  totalScheduled: number;
  totalRevised: number;
};

export type AutoRevisionSummary = {
  todayPending: number;
  weekPending: number;
  monthPending: number;
};
