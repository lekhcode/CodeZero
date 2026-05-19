import type { DifficultyLevel } from "@/types/api.types";

export type AutoRevisionType = "DAILY" | "WEEKLY" | "MONTHLY";

export type AutoRevisionItem = {
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

export type AutoRevisionTodayGrouped = {
  daily: AutoRevisionItem[];
  weekly: AutoRevisionItem[];
  monthly: AutoRevisionItem[];
};

export type AutoRevisionWeekResponse = {
  weekRange: { start: string; end: string; label: string };
  weekOffset: number;
  problems: AutoRevisionItem[];
  totalScheduled: number;
  totalRevised: number;
};

export type AutoRevisionMonthResponse = {
  monthLabel: string;
  monthOffset: number;
  range: { start: string; end: string };
  problems: AutoRevisionItem[];
  totalScheduled: number;
  totalRevised: number;
};

export type AutoRevisionSummary = {
  todayPending: number;
  weekPending: number;
  monthPending: number;
};
