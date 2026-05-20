import { getUtcDateKey } from "@/utils/date";

/** Prefixes for partial invalidation (any calendar day). */
export const trackedTodayPrefix = ["learning", "today"] as const;
export const trackedDuePrefix = ["learning", "due"] as const;

/** Centralized React Query keys — prevents typos and eases invalidation. */
export const queryKeys = {
  me: ["auth", "me"] as const,
  templates: ["schedule-templates"] as const,
  userSchedules: ["user-schedules"] as const,
  todayAssignments: ["assignments", "today"] as const,
  trackedToday: (dateKey = getUtcDateKey()) => [...trackedTodayPrefix, dateKey] as const,
  trackedDue: (dateKey = getUtcDateKey()) => [...trackedDuePrefix, dateKey] as const,
  trackedHistory: (page: number) => ["learning", "history", page] as const,
  submissionActivity: (selection: string | number) => ["submissions", "activity", selection] as const,
  learningInsights: ["learning", "insights"] as const,
  leaderboard: ["users", "leaderboard"] as const,
  submissions: (filters: Record<string, unknown>) => ["submissions", filters] as const,
  submissionsSolvedStats: ["submissions", "solved-stats"] as const,
  submission: (id: string) => ["submissions", id] as const,
  problem: (slug: string) => ["problems", slug] as const,
  problemCatalog: (filters: Record<string, unknown>) => ["problems", "catalog", filters] as const,
  problemTopics: (includePremium: boolean) => ["problems", "topics", includePremium] as const,
  problemCatalogStats: (includePremium: boolean) => ["problems", "stats", includePremium] as const,
  judgeMeta: (slug: string) => ["judge-meta", slug] as const,
  dailyProblem: ["daily-problem"] as const,
  brainCachePlaylists: ["brain-cache", "playlists"] as const,
  brainCacheToday: (dateKey = getUtcDateKey()) => ["brain-cache", "revisions", "today", dateKey] as const,
  brainCacheOverdue: (dateKey = getUtcDateKey()) =>
    ["brain-cache", "revisions", "overdue", dateKey] as const,
  brainCacheAnalytics: ["brain-cache", "analytics"] as const,
  brainCacheMemberships: (slug: string) => ["brain-cache", "memberships", slug] as const,
  brainCachePlaylistProblems: (playlistId: string) =>
    ["brain-cache", "playlist", playlistId, "problems"] as const,
  autoRevisionSummary: (timezone: string) => ["auto-revisions", "summary", timezone] as const,
  autoRevisionToday: (timezone: string) => ["auto-revisions", "today", timezone] as const,
  autoRevisionWeek: (weekOffset: number, timezone: string) =>
    ["auto-revisions", "week", weekOffset, timezone] as const,
  autoRevisionMonth: (monthOffset: number, timezone: string) =>
    ["auto-revisions", "month", monthOffset, timezone] as const,
  dueCalendarSummary: (year: number, monthIndex: number) =>
    [...dueCalendarSummaryPrefix, year, monthIndex] as const,
  dueCalendarSummaryWeek: (weekStart: string) =>
    [...dueCalendarSummaryPrefix, "week", weekStart] as const,
  dueCalendarDay: (date: string) => [...dueCalendarDayPrefix, date] as const,
  forumHub: ["forum", "hub"] as const,
  forumPosts: (filters: Record<string, unknown>) => ["forum", "posts", filters] as const,
  forumPost: (id: string) => ["forum", "post", id] as const,
  forumComments: (postId: string) => ["forum", "comments", postId] as const,
};

export const brainCacheKeyPrefix = ["brain-cache"] as const;
export const autoRevisionKeyPrefix = ["auto-revisions"] as const;

export const dueCalendarSummaryPrefix = ["due-calendar-summary"] as const;
export const dueCalendarDayPrefix = ["due-calendar-day"] as const;

/** Invalidate all learning-progress queries after a successful submit. */
/** Prefixes invalidated after a successful full submit. */
export const learningProgressKeyPrefixes = [
  trackedTodayPrefix,
  trackedDuePrefix,
  queryKeys.todayAssignments,
  ["submissions", "activity"] as const,
  queryKeys.learningInsights,
  queryKeys.leaderboard,
  ["submissions"] as const,
  ["problems", "catalog"] as const,
  dueCalendarSummaryPrefix,
  dueCalendarDayPrefix,
  autoRevisionKeyPrefix,
] as const;
