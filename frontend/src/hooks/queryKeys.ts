/** Centralized React Query keys — prevents typos and eases invalidation. */
export const queryKeys = {
  me: ["auth", "me"] as const,
  templates: ["schedule-templates"] as const,
  userSchedules: ["user-schedules"] as const,
  todayAssignments: ["assignments", "today"] as const,
  problem: (slug: string) => ["problems", slug] as const,
  judgeMeta: (slug: string) => ["judge-meta", slug] as const,
  dailyProblem: ["daily-problem"] as const,
};
