import type { AutoRevisionType, DifficultyLevel } from "@prisma/client";

export type AutoRevisionDto = {
  id: string;
  userId: string;
  problemId: string;
  problemTitle: string;
  difficulty: DifficultyLevel;
  slug: string;
  topics: string[];
  primaryTopic: string;
  revisionStreak: number;
  solvedAt: string;
  revisionType: AutoRevisionType;
  scheduledFor: string;
  isRevised: boolean;
  revisedAt: string | null;
  /** True when scheduledFor is before today and not yet revised. */
  isOverdue: boolean;
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

export type AutoRevisionMonthStats = {
  total: number;
  revised: number;
  pending: number;
  missed: number;
  completionPct: number;
};

export type AutoRevisionMonthResponse = {
  monthLabel: string;
  monthOffset: number;
  range: { start: string; end: string };
  problems: AutoRevisionDto[];
  totalScheduled: number;
  totalRevised: number;
  stats: AutoRevisionMonthStats;
};

export type AutoRevisionSummary = {
  todayPending: number;
  weekPending: number;
  monthPending: number;
  totalPending: number;
  completion30DayPct: number;
  scheduled30Day: number;
  revised30Day: number;
};

export type AutoRevisionFeedResponse = {
  items: AutoRevisionDto[];
  weakTopics: Array<{ topic: string; pending: number }>;
};

export type AutoRevisionHistoryStatus = "completed" | "missed" | "skipped";

export type AutoRevisionHistoryItem = AutoRevisionDto & {
  status: AutoRevisionHistoryStatus;
  timeSpentMinutes: number | null;
  performanceScore: number | null;
  notes: string | null;
};

export type AutoRevisionHistoryResponse = {
  items: AutoRevisionHistoryItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type AutoRevisionActivityDay = {
  date: string;
  count: number;
};

export type AutoRevisionActivityResponse = {
  days: AutoRevisionActivityDay[];
};
