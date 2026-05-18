import {
  AssignmentStatus,
  type Prisma,
  ScheduleType,
  SubmissionStatus,
} from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { findTodayDailyPotdSlot } from "../leetcode/dailyPotd.service.js";
import { mapProblemRowToDetailResponse } from "../leetcode/leetcode.mapper.js";
import { getTodayAssignmentsForUser } from "./assignments.service.js";
import { startOfUtcDay } from "./studyPlanAssignment.js";

export type TrackedAssignmentItem = {
  id: string;
  assignedDate: string;
  status: AssignmentStatus;
  solvedAt: string | null;
  submissionCount: number;
  userScheduleId: string;
  scheduleName: string;
  scheduleSlug: string;
  scheduleType: ScheduleType;
  problem: ReturnType<typeof mapProblemRowToDetailResponse>;
};

export type LearningStats = {
  solvedToday: number;
  pendingToday: number;
  dueCount: number;
  totalAccepted: number;
  totalSolved: number;
  totalProblemsInCatalog: number;
};

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function todayUtc(): Date {
  return startOfUtcDay(new Date());
}

type DeliveredProblem = {
  userScheduleId: string;
  problemId: string;
};

/** Collect problem IDs delivered today from computed assignments (no duplicate rows). */
async function collectDeliveredToday(userId: string): Promise<DeliveredProblem[]> {
  const { assignments } = await getTodayAssignmentsForUser(userId);
  const seen = new Set<string>();
  const slugPairs: Array<{ userScheduleId: string; slug: string }> = [];

  for (const item of assignments) {
    if (item.status !== "ready" || item.problems.length === 0) continue;
    for (const problem of item.problems) {
      const key = `${item.userScheduleId}:${problem.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      slugPairs.push({ userScheduleId: item.userScheduleId, slug: problem.slug });
    }
  }

  if (slugPairs.length === 0) return [];

  const slugs = [...new Set(slugPairs.map((p) => p.slug))];
  const rows = await prisma.problem.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  const idBySlug = new Map(rows.map((r) => [r.slug, r.id]));

  return slugPairs.flatMap((pair) => {
    const problemId = idBySlug.get(pair.slug);
    return problemId !== undefined
      ? [{ userScheduleId: pair.userScheduleId, problemId }]
      : [];
  });
}

async function solvedProblemMap(
  userId: string,
  problemIds: string[],
): Promise<Map<string, { solvedAt: Date; solvedSubmissionId: string }>> {
  if (problemIds.length === 0) return new Map();

  const rows = await prisma.userProblemSolve.findMany({
    where: { userId, problemId: { in: problemIds } },
    select: { problemId: true, solvedAt: true, solvedSubmissionId: true },
  });

  return new Map(
    rows.map((r) => [r.problemId, { solvedAt: r.solvedAt, solvedSubmissionId: r.solvedSubmissionId }]),
  );
}

/**
 * Assignment rows can be created after the user already AC'd the problem (study plan day N,
 * POTD overlap, or solve from the problem page). Align DB status with `user_problem_solves`.
 */
export async function reconcileSolvedAssignments(userId: string): Promise<void> {
  const open = await prisma.assignment.findMany({
    where: {
      userId,
      status: { in: [AssignmentStatus.PENDING, AssignmentStatus.MISSED] },
    },
    select: { problemId: true },
  });
  if (open.length === 0) return;

  const solveByProblem = await solvedProblemMap(userId, [...new Set(open.map((a) => a.problemId))]);

  await Promise.all(
    [...solveByProblem.entries()].map(([problemId, solve]) =>
      prisma.assignment.updateMany({
        where: {
          userId,
          problemId,
          status: { in: [AssignmentStatus.PENDING, AssignmentStatus.MISSED] },
        },
        data: {
          status: AssignmentStatus.SOLVED,
          solvedAt: solve.solvedAt,
          solvedSubmissionId: solve.solvedSubmissionId,
        },
      }),
    ),
  );
}

/**
 * Remove today's POTD assignment rows that no longer match the official calendar slot
 * (e.g. yesterday's problem synced under today's date before the correct row existed).
 */
async function pruneStaleTodayPotdAssignments(
  userId: string,
  assignedDate: Date,
  delivered: DeliveredProblem[],
): Promise<void> {
  const potdSchedules = await prisma.userSchedule.findMany({
    where: { userId, active: true, template: { type: ScheduleType.DAILY_POTD } },
    select: { id: true },
  });
  if (potdSchedules.length === 0) return;

  const allowedBySchedule = new Map<string, Set<string>>();
  for (const item of delivered) {
    const allowed = allowedBySchedule.get(item.userScheduleId) ?? new Set<string>();
    allowed.add(item.problemId);
    allowedBySchedule.set(item.userScheduleId, allowed);
  }

  await Promise.all(
    potdSchedules.map(async (schedule) => {
      const allowed = allowedBySchedule.get(schedule.id);
      if (allowed === undefined || allowed.size === 0) {
        await prisma.assignment.deleteMany({
          where: { userId, userScheduleId: schedule.id, assignedDate },
        });
        return;
      }
      await prisma.assignment.deleteMany({
        where: {
          userId,
          userScheduleId: schedule.id,
          assignedDate,
          problemId: { notIn: [...allowed] },
        },
      });
    }),
  );
}

/** Upsert today's assignment rows; idempotent via unique constraint. */
export async function syncTodayAssignments(userId: string): Promise<void> {
  const assignedDate = todayUtc();
  const delivered = await collectDeliveredToday(userId);
  await pruneStaleTodayPotdAssignments(userId, assignedDate, delivered);
  if (delivered.length === 0) return;

  const problemIds = [...new Set(delivered.map((d) => d.problemId))];
  const solveByProblem = await solvedProblemMap(userId, problemIds);

  await prisma.$transaction(
    delivered.map((item) => {
      const solve = solveByProblem.get(item.problemId);
      return prisma.assignment.upsert({
        where: {
          userId_problemId_userScheduleId_assignedDate: {
            userId,
            problemId: item.problemId,
            userScheduleId: item.userScheduleId,
            assignedDate,
          },
        },
        create: {
          userId,
          problemId: item.problemId,
          userScheduleId: item.userScheduleId,
          assignedDate,
          status: solve !== undefined ? AssignmentStatus.SOLVED : AssignmentStatus.PENDING,
          solvedAt: solve?.solvedAt ?? null,
          solvedSubmissionId: solve?.solvedSubmissionId ?? null,
        },
        update:
          solve !== undefined
            ? {
                status: AssignmentStatus.SOLVED,
                solvedAt: solve.solvedAt,
                solvedSubmissionId: solve.solvedSubmissionId,
              }
            : {},
      });
    }),
  );

  await reconcileSolvedAssignments(userId);
}

/** Mark stale pending rows as MISSED before due/today reads. */
export async function refreshOverdueAssignments(userId: string): Promise<void> {
  const today = todayUtc();
  await prisma.assignment.updateMany({
    where: {
      userId,
      status: AssignmentStatus.PENDING,
      assignedDate: { lt: today },
    },
    data: { status: AssignmentStatus.MISSED },
  });
}

export async function markAssignmentsSolvedOnAccept(input: {
  userId: string;
  problemId: string;
  judgeSubmissionId: string;
}): Promise<void> {
  const now = new Date();
  await prisma.assignment.updateMany({
    where: {
      userId: input.userId,
      problemId: input.problemId,
      status: { in: [AssignmentStatus.PENDING, AssignmentStatus.MISSED] },
    },
    data: {
      status: AssignmentStatus.SOLVED,
      solvedAt: now,
      solvedSubmissionId: input.judgeSubmissionId,
    },
  });
}

async function submissionCountsByProblem(
  userId: string,
  problemIds: string[],
): Promise<Map<string, number>> {
  if (problemIds.length === 0) return new Map();

  const grouped = await prisma.judgeSubmission.groupBy({
    by: ["problemId"],
    where: { userId, problemId: { in: problemIds } },
    _count: { _all: true },
  });

  return new Map(grouped.map((g) => [g.problemId, g._count._all]));
}

const assignmentInclude = {
  problem: true,
  userSchedule: { include: { template: { select: { name: true, slug: true, type: true } } } },
} satisfies Prisma.AssignmentInclude;

function mapAssignmentRow(
  row: Prisma.AssignmentGetPayload<{ include: typeof assignmentInclude }>,
  submissionCounts: Map<string, number>,
): TrackedAssignmentItem {
  return {
    id: row.id,
    assignedDate: formatDateOnly(row.assignedDate),
    status: row.status,
    solvedAt: row.solvedAt?.toISOString() ?? null,
    submissionCount: submissionCounts.get(row.problemId) ?? 0,
    userScheduleId: row.userScheduleId,
    scheduleName: row.userSchedule.template.name,
    scheduleSlug: row.userSchedule.template.slug,
    scheduleType: row.userSchedule.template.type,
    problem: mapProblemRowToDetailResponse(row.problem),
  };
}

export async function getTrackedTodayAssignments(userId: string): Promise<{
  assignments: TrackedAssignmentItem[];
  stats: LearningStats;
}> {
  await syncTodayAssignments(userId);
  await refreshOverdueAssignments(userId);

  const today = todayUtc();
  const rows = await prisma.assignment.findMany({
    where: { userId, assignedDate: today },
    include: assignmentInclude,
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  const potdSlot = await findTodayDailyPotdSlot();
  const potdProblemId = potdSlot?.problemId ?? null;
  const filteredRows = rows.filter((row) => {
    if (row.userSchedule.template.type !== ScheduleType.DAILY_POTD) {
      return true;
    }
    return potdProblemId !== null && row.problemId === potdProblemId;
  });

  const problemIds = [...new Set(filteredRows.map((r) => r.problemId))];
  const submissionCounts = await submissionCountsByProblem(userId, problemIds);
  const assignments = filteredRows.map((r) => mapAssignmentRow(r, submissionCounts));
  const stats = await getLearningStats(userId);

  return { assignments, stats };
}

export async function getDueAssignments(userId: string): Promise<{
  assignments: TrackedAssignmentItem[];
}> {
  await refreshOverdueAssignments(userId);
  await reconcileSolvedAssignments(userId);

  const today = todayUtc();
  const rows = await prisma.assignment.findMany({
    where: {
      userId,
      assignedDate: { lt: today },
      status: { in: [AssignmentStatus.PENDING, AssignmentStatus.MISSED] },
    },
    include: assignmentInclude,
    orderBy: [{ assignedDate: "asc" }, { createdAt: "asc" }],
  });

  const problemIds = [...new Set(rows.map((r) => r.problemId))];
  const submissionCounts = await submissionCountsByProblem(userId, problemIds);

  return { assignments: rows.map((r) => mapAssignmentRow(r, submissionCounts)) };
}

export async function getAssignmentHistory(
  userId: string,
  params: { page: number; limit: number },
): Promise<{
  assignments: TrackedAssignmentItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  const page = Math.max(1, Math.trunc(Number(params.page)) || 1);
  const limit = Math.min(50, Math.max(1, Math.trunc(Number(params.limit)) || 20));
  const skip = (page - 1) * limit;

  const [total, rows] = await prisma.$transaction([
    prisma.assignment.count({ where: { userId } }),
    prisma.assignment.findMany({
      where: { userId },
      include: assignmentInclude,
      orderBy: [{ assignedDate: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  const problemIds = [...new Set(rows.map((r) => r.problemId))];
  const submissionCounts = await submissionCountsByProblem(userId, problemIds);

  return {
    assignments: rows.map((r) => mapAssignmentRow(r, submissionCounts)),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getLearningStats(userId: string): Promise<LearningStats> {
  const today = todayUtc();

  const [solvedToday, pendingToday, dueCount, totalAccepted, totalSolved, totalProblemsInCatalog] =
    await Promise.all([
      prisma.assignment.count({
        where: { userId, assignedDate: today, status: AssignmentStatus.SOLVED },
      }),
      prisma.assignment.count({
        where: {
          userId,
          assignedDate: today,
          status: { in: [AssignmentStatus.PENDING, AssignmentStatus.MISSED] },
        },
      }),
      prisma.assignment.count({
        where: {
          userId,
          assignedDate: { lt: today },
          status: { in: [AssignmentStatus.PENDING, AssignmentStatus.MISSED] },
        },
      }),
      prisma.judgeSubmission.count({
        where: { userId, status: SubmissionStatus.ACCEPTED },
      }),
      prisma.userProblemSolve.count({ where: { userId } }),
      prisma.problem.count(),
    ]);

  return {
    solvedToday,
    pendingToday,
    dueCount,
    totalAccepted,
    totalSolved,
    totalProblemsInCatalog,
  };
}
