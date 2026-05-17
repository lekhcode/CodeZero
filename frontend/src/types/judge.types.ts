


export type JudgeMode = "RUN_SAMPLE" | "FULL_JUDGE";

export type SubmissionStatus =
  | "QUEUED"
  | "RUNNING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "RUNTIME_ERROR"
  | "COMPILATION_ERROR"
  | "TIME_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR";

export type JudgeMetaLanguage = {
  id: string;
  starterCode: string;
  functionName: string;
  paramNames: string[];
  judgeReadyForLanguage: boolean;
};

export type JudgeVisibleTestcase = {
  orderIndex: number;
  input: string;
  expectedOutput: string;
};

export type JudgeRecentSubmission = {
  id: string;
  status: SubmissionStatus;
  mode: JudgeMode;
  language: string;
  runtimeMs: number | null;
  /** Browser-reported elapsed editor time until Submit (ms); null when not tracked */
  codingDurationMs: number | null;
  createdAt: string;
};

export type JudgeMeta = {
  problemId: string;
  slug: string;
  title: string;
  difficulty: string;
  topics: string[];
  isPremium: boolean;
  statement: string;
  constraints: string[];
  locked: boolean;
  lockReason: string | null;
  languages: JudgeMetaLanguage[];
  visibleTestcases: JudgeVisibleTestcase[];
  solved: boolean;
  solvedAt: string | null;
  recentSubmissions: JudgeRecentSubmission[];
};

export type JudgeCaseResult = {
  index: number;
  passed: boolean;
  hidden?: boolean;
  actual?: string;
  expected?: string;
  inputPreview?: string;
  error?: string;
};

export type JudgeSubmission = {
  id: string;
  status: SubmissionStatus;
  mode: JudgeMode;
  language: string;
  /** Returned when fetching your own submission (for replay / view solution). */
  code?: string;
  codingDurationMs?: number | null;
  testResults: JudgeCaseResult[] | null;
  stdout: string | null;
  stderr: string | null;
  /** Max testcase harness time (user code only). */
  runtimeMs: number | null;
  queueTimeMs?: number | null;
  compileTimeMs?: number | null;
  executionTimeMs?: number | null;
  totalTimeMs?: number | null;
  sandboxWallMs?: number | null;
  exitCode: number | null;
  createdAt: string;
  updatedAt: string;
};
