export type BrainCacheRevisionStatus = "PENDING" | "DUE" | "OVERDUE" | "COMPLETED" | "SKIPPED";

export type BrainCacheNotificationPrefs = {
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
  notifyInApp: boolean;
  notifyPush: boolean;
};

export type BrainCachePlaylist = {
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
  difficulty: string;
  topics: string[];
};

export type BrainCacheRevisionTask = {
  id: string;
  playlistId: string;
  playlistName: string;
  playlistProblemId: string;
  problem: BrainCacheProblemSummary;
  dueDate: string;
  completedAt: string | null;
  status: BrainCacheRevisionStatus;
};

export type BrainCacheAnalytics = {
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

export type BrainCacheProblemMembership = {
  playlistId: string;
  playlistName: string;
  playlistProblemId: string;
};

export type CreateBrainCachePlaylistInput = {
  name: string;
  revisionIntervalDays?: number;
  customRevisionDates?: string[];
  notificationPrefs?: Partial<BrainCacheNotificationPrefs>;
};

export type UpdateBrainCachePlaylistInput = Partial<CreateBrainCachePlaylistInput>;

export type BrainCachePlaylistProblemEntry = {
  playlistProblemId: string;
  problem: BrainCacheProblemSummary;
  addedAt: string;
  nextDueDate: string | null;
  openRevisionCount: number;
};
