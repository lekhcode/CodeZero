import { DifficultyLevel, JudgeMode, type SubmissionStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { collapseConsecutiveByProblem } from "./submissionCollapse.js";
import type { ListSubmissionsQuery } from "./submissions.validation.js";

/** Max raw rows scanned when building collapsed timeline (pagination applied after). */
const COLLAPSE_SCAN_CAP = 5_000;

export type SubmissionListItem = {
  id: string;
  status: SubmissionStatus;
  language: string;
  mode: JudgeMode;
  runtimeMs: number | null;
  codingDurationMs: number | null;
  createdAt: string;
  /** Attempts in this consecutive same-problem run (1 = single visible row). */
  collapsedAttempts: number;
  problem: {
    slug: string;
    title: string;
    difficulty: string;
  };
};

export type SubmissionDetail = SubmissionListItem & {
  code: string;
  stdout: string | null;
  stderr: string | null;
  exitCode: number | null;
  updatedAt: string;
};

type ListRow = {
  id: string;
  problemId: string;
  status: SubmissionStatus;
  language: string;
  mode: JudgeMode;
  runtimeMs: number | null;
  codingDurationMs: number | null;
  createdAt: Date;
  problem: { slug: string; title: string; difficulty: string };
};

function mapListRow(row: ListRow, collapsedAttempts: number): SubmissionListItem {
  return {
    id: row.id,
    status: row.status,
    language: row.language,
    mode: row.mode,
    runtimeMs: row.runtimeMs,
    codingDurationMs: row.codingDurationMs,
    createdAt: row.createdAt.toISOString(),
    collapsedAttempts,
    problem: {
      slug: row.problem.slug,
      title: row.problem.title,
      difficulty: row.problem.difficulty,
    },
  };
}

export async function listSubmissionsForUser(
  userId: string,
  query: ListSubmissionsQuery,
): Promise<{
  submissions: SubmissionListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  rawTotal: number;
}> {
  const page = Math.max(1, Math.trunc(Number(query.page)) || 1);
  const limit = Math.min(50, Math.max(1, Math.trunc(Number(query.limit)) || 20));
  const { verdict, language, problemSlug } = query;
  const skip = (page - 1) * limit;

  let problemId: string | undefined;
  if (problemSlug !== undefined) {
    const problem = await prisma.problem.findUnique({
      where: { slug: problemSlug },
      select: { id: true },
    });
    if (problem === null) {
      return { submissions: [], page, limit, total: 0, totalPages: 1, rawTotal: 0 };
    }
    problemId = problem.id;
  }

  const where = {
    userId,
    ...(verdict !== undefined ? { status: verdict } : {}),
    ...(language !== undefined ? { language } : {}),
    ...(problemId !== undefined ? { problemId } : {}),
  };

  const [rawTotal, rows] = await prisma.$transaction([
    prisma.judgeSubmission.count({ where }),
    prisma.judgeSubmission.findMany({
      where,
      include: {
        problem: { select: { slug: true, title: true, difficulty: true } },
      },
      orderBy: { createdAt: "desc" },
      take: COLLAPSE_SCAN_CAP,
    }),
  ]);

  const collapsed = collapseConsecutiveByProblem(rows).map(({ representative, collapsedAttempts }) =>
    mapListRow(representative, collapsedAttempts),
  );

  const total = collapsed.length;
  const submissions = collapsed.slice(skip, skip + limit);

  return {
    submissions,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    rawTotal,
  };
}

export type SolvedDifficultyStats = {
  total: number;
  easy: number;
  medium: number;
  hard: number;
};

/** Distinct problems the user has fully solved (accepted submit), grouped by difficulty. */
export async function getSolvedDifficultyStatsForUser(
  userId: string,
): Promise<SolvedDifficultyStats> {
  const grouped = await prisma.problem.groupBy({
    by: ["difficulty"],
    where: { userSolves: { some: { userId } } },
    _count: { _all: true },
  });

  let easy = 0;
  let medium = 0;
  let hard = 0;

  for (const row of grouped) {
    const count = row._count._all;
    if (row.difficulty === DifficultyLevel.EASY) {
      easy = count;
    } else if (row.difficulty === DifficultyLevel.MEDIUM) {
      medium = count;
    } else if (row.difficulty === DifficultyLevel.HARD) {
      hard = count;
    }
  }

  return {
    total: easy + medium + hard,
    easy,
    medium,
    hard,
  };
}

export async function getSubmissionForUser(
  userId: string,
  submissionId: string,
): Promise<{ submission: SubmissionDetail }> {
  const row = await prisma.judgeSubmission.findUnique({
    where: { id: submissionId },
    include: {
      problem: { select: { slug: true, title: true, difficulty: true } },
    },
  });

  if (row === null) throw ApiError.notFound("Submission not found");
  if (row.userId !== userId) throw ApiError.forbidden();

  return {
    submission: {
      ...mapListRow(row, 1),
      code: row.code,
      stdout: row.stdout,
      stderr: row.stderr,
      exitCode: row.exitCode,
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}
