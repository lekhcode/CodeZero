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
  createdAt: string;
};

export type LoginResult = {
  user: PublicUser;
  accessToken: string;
};

export type RegisterResult = {
  user: PublicUser;
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
