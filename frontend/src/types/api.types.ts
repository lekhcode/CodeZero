/** Mirrors backend `{ success: true, data }` envelope. */
export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: Array<{ path: string; message: string }>;
  };
};

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD" | "MIXED";
export type ScheduleType = "DAILY_POTD" | "TOPIC" | "STUDY_PLAN";

export type PublicUser = {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  fullName: string | null;
  country: string | null;
  gender: "MALE" | "FEMALE" | "NON_BINARY" | "OTHER" | "PREFER_NOT_TO_SAY" | null;
  avatar: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoginResult = {
  user: PublicUser;
  accessToken: string;
};

export type RegisterResult = {
  user: PublicUser;
  requiresVerification: true;
  message: string;
};

export type ScheduleTemplate = {
  id: string;
  name: string;
  slug: string;
  type: ScheduleType;
  isSystem: boolean;
  allowsDifficulty: boolean;
  allowsCount: boolean;
  defaultCount: number | null;
  createdAt: string;
};

export type UserSchedule = {
  id: string;
  userId: string;
  templateId: string;
  active: boolean;
  dailyQuestions: number | null;
  difficulty: DifficultyLevel | null;
  createdAt: string;
  template: {
    id: string;
    name: string;
    slug: string;
    type: ScheduleType;
    allowsDifficulty?: boolean;
    allowsCount?: boolean;
    defaultCount?: number | null;
  };
};

export type ProblemExample = {
  input: string;
  output: string;
  explanation: string;
};

export type ProblemDetail = {
  title: string;
  slug: string;
  difficulty: string;
  topics: string[];
  statement: string;
  examples: ProblemExample[];
  constraints: string[];
  isPremium: boolean;
};

export type ProblemCatalogItem = {
  id: string;
  leetcodeId: number;
  title: string;
  slug: string;
  difficulty: DifficultyLevel;
  topics: string[];
  isPremium: boolean;
  hasDetail: boolean;
  solved: boolean;
};

export type ProblemCatalogPage = {
  items: ProblemCatalogItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  solvedCount?: number;
};

export type ProblemTopicTag = {
  name: string;
  count: number;
};

export type SolvedDifficultyStats = {
  total: number;
  easy: number;
  medium: number;
  hard: number;
};

export type ProblemCatalogStats = {
  total: number;
  easy: number;
  medium: number;
  hard: number;
};

export type ProblemCatalogFilters = {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: DifficultyLevel[];
  topics?: string[];
  includePremium?: boolean;
  /** Server-side random sample (dashboard preview). */
  shuffle?: boolean;
};

export type StudyPlanProgress = {
  dayIndex: number;
  dailyCount: number;
  assignedOrders: number[];
  totalInPlan: number;
};

export type AssignmentStatus = "ready" | "pending" | "unavailable" | "completed";

export type TodayAssignment = {
  userScheduleId: string;
  templateSlug: string;
  templateName: string;
  scheduleType: ScheduleType;
  problems: ProblemDetail[];
  status: AssignmentStatus;
  challengeDate?: string;
  planProgress?: StudyPlanProgress;
};

export type TodayAssignmentsResponse = {
  assignments: TodayAssignment[];
};

export type CreateUserScheduleInput = {
  templateSlug: string;
  dailyQuestions?: number;
  difficulty?: DifficultyLevel;
};

export type TrackedAssignmentStatus = "PENDING" | "SOLVED" | "MISSED" | "SKIPPED";

export type TrackedAssignment = {
  id: string;
  assignedDate: string;
  status: TrackedAssignmentStatus;
  solvedAt: string | null;
  submissionCount: number;
  userScheduleId: string;
  scheduleName: string;
  scheduleSlug: string;
  scheduleType: ScheduleType;
  problem: ProblemDetail;
};

export type LearningStats = {
  solvedToday: number;
  pendingToday: number;
  dueCount: number;
  totalAccepted: number;
  totalSolved: number;
  totalProblemsInCatalog: number;
};

export type TrackedTodayResponse = {
  assignments: TrackedAssignment[];
  stats: LearningStats;
};

export type TrackedDueResponse = {
  assignments: TrackedAssignment[];
};

export type TrackedHistoryResponse = {
  assignments: TrackedAssignment[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SubmissionStatus =
  | "QUEUED"
  | "RUNNING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "TIME_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR";

export type JudgeMode = "RUN_SAMPLE" | "FULL_JUDGE";

export type SubmissionListItem = {
  id: string;
  status: SubmissionStatus;
  language: string;
  mode: JudgeMode;
  runtimeMs: number | null;
  codingDurationMs: number | null;
  createdAt: string;
  /** Consecutive same-problem attempts merged into this row (newest kept). */
  collapsedAttempts: number;
  problem: {
    slug: string;
    title: string;
    difficulty: string;
  };
};

export type SubmissionsListResponse = {
  submissions: SubmissionListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  rawTotal: number;
};

export type ActivityDay = {
  date: string;
  count: number;
  acceptedCount: number;
};

export type SubmissionActivitySummary = {
  view: "rolling" | "calendar";
  year: number | null;
  rangeLabel: string;
  availableYears: number[];
  totalSubmissions: number;
  activeDays: number;
  currentStreak: number;
  maxStreak: number;
  days: ActivityDay[];
};

export type DailyLearningPoint = {
  date: string;
  solvedCount: number;
  acceptedCount: number;
};

export type LearningInsights = {
  rangeDays: number;
  dailyPoints: DailyLearningPoint[];
  trend: "up" | "down" | "stable";
  consistencyPercent: number;
  totalSolvedInRange: number;
  totalAcceptedInRange: number;
  comparisonLabel: string;
};

export type SubmissionDetailResponse = {
  submission: SubmissionListItem & {
    code: string;
    stdout: string | null;
    stderr: string | null;
    exitCode: number | null;
    updatedAt: string;
  };
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarSeed: string;
  problemsSolved: number;
  acceptedSubmissions: number;
  isCurrentUser: boolean;
};

export type LeaderboardResponse = {
  totalUsers: number;
  entries: LeaderboardEntry[];
  currentUserRank: number | null;
};
