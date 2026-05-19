export type DueItemStatus = "completed" | "overdue" | "completed-late" | "skipped";

export type DueItemDifficulty = "Easy" | "Medium" | "Hard";

export type DueItemSource = "assignment" | "brain-cache";

export interface DayCell {
  date: string;
  assignmentDue: number;
  assignmentDone: number;
  revisionDue: number;
  revisionDone: number;
  hasOverdue: boolean;
}

export interface DueCalendarSummaryResponse {
  days: DayCell[];
}

export interface DueItem {
  id: string;
  problemTitle: string;
  problemSlug: string;
  difficulty: DueItemDifficulty;
  source: DueItemSource;
  sourceName: string;
  status: DueItemStatus;
  dueDate: string;
  completedAt?: string;
  daysOverdue?: number;
}

export interface DueCalendarDayResponse {
  date: string;
  items: DueItem[];
}

export type CalendarDotTone = "none" | "success" | "warning" | "danger";
