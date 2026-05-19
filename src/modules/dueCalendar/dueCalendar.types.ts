export type DueItemStatus = "completed" | "overdue" | "completed-late" | "skipped";

export type DueItemSource = "assignment" | "brain-cache";

export type DueCalendarDaySummary = {
  date: string;
  assignmentDue: number;
  assignmentDone: number;
  revisionDue: number;
  revisionDone: number;
  hasOverdue: boolean;
};

export type DueCalendarSummaryResponse = {
  days: DueCalendarDaySummary[];
};

export type DueCalendarItem = {
  id: string;
  problemTitle: string;
  problemSlug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  source: DueItemSource;
  sourceName: string;
  status: DueItemStatus;
  dueDate: string;
  completedAt?: string;
  daysOverdue?: number;
};

export type DueCalendarDayResponse = {
  date: string;
  items: DueCalendarItem[];
};
