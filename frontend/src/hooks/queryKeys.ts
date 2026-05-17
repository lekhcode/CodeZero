/** Centralized React Query keys — prevents typos and eases invalidation. */
export const queryKeys = {
  me: ["auth", "me"] as const,
  templates: ["schedule-templates"] as const,
  userSchedules: ["user-schedules"] as const,
  todayAssignments: ["assignments", "today"] as const,
  trackedToday: ["learning", "today"] as const,
  trackedDue: ["learning", "due"] as const,
  trackedHistory: (page: number) => ["learning", "history", page] as const,
  submissionActivity: (selection: string | number) => ["submissions", "activity", selection] as const,
  learningInsights: ["learning", "insights"] as const,
  submissions: (filters: Record<string, unknown>) => ["submissions", filters] as const,
  submission: (id: string) => ["submissions", id] as const,
  problem: (slug: string) => ["problems", slug] as const,
  judgeMeta: (slug: string) => ["judge-meta", slug] as const,
  dailyProblem: ["daily-problem"] as const,
};

/** Invalidate all learning-progress queries after a successful submit. */
/** Prefixes invalidated after a successful full submit. */
export const learningProgressKeyPrefixes = [
  queryKeys.trackedToday,
  queryKeys.trackedDue,
  queryKeys.todayAssignments,
  ["submissions", "activity"] as const,
  queryKeys.learningInsights,
  ["submissions"] as const,
] as const;
