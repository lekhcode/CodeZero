import type { BrainCacheRevisionStatus, DifficultyLevel } from "@prisma/client";

export type BrainCacheNotificationPrefs = {
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
  notifyInApp: boolean;
  notifyPush: boolean;
};

export type BrainCachePlaylistDto = {
  id: string;
  name: string;
  revisionIntervalDays: number;
  customRevisionDates: string[];
  notificationPrefs: BrainCacheNotificationPrefs;
  problemCount: number;
  dueCount: number;
  overdueCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BrainCacheProblemSummary = {
  id: string;
  slug: string;
  title: string;
  difficulty: DifficultyLevel;
  topics: string[];
};

export type BrainCacheRevisionTaskDto = {
  id: string;
  playlistId: string;
  playlistName: string;
  playlistProblemId: string;
  problem: BrainCacheProblemSummary;
  dueDate: string;
  completedAt: string | null;
  status: BrainCacheRevisionStatus;
};

export type BrainCacheAnalyticsDto = {
  totalCompleted: number;
  overdueCount: number;
  dueTodayCount: number;
  completionRatePct: number;
  revisionStreakDays: number;
  playlistActivity: Array<{
    playlistId: string;
    playlistName: string;
    completedCount: number;
    problemCount: number;
  }>;
};

export type BrainCacheProblemMembershipDto = {
  playlistId: string;
  playlistName: string;
  playlistProblemId: string;
};

export type BrainCachePlaylistProblemEntryDto = {
  playlistProblemId: string;
  problem: BrainCacheProblemSummary;
  addedAt: string;
  nextDueDate: string | null;
  openRevisionCount: number;
};
