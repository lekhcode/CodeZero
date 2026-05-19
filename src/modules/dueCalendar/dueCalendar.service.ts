import {
  AssignmentStatus,
  BrainCacheRevisionStatus,
  type DifficultyLevel,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { refreshOpenRevisionStatuses } from "../brainCache/brainCache.revision.service.js";
import { refreshOverdueAssignments } from "../assignments/assignmentTracking.service.js";
import { startOfUtcDay } from "../assignments/studyPlanAssignment.js";
import type {
  DueCalendarDayResponse,
  DueCalendarDaySummary,
  DueCalendarItem,
  DueCalendarSummaryResponse,
  DueItemStatus,
} from "./dueCalendar.types.js";

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateFromKey(key: string): Date {
  const parts = key.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return startOfUtcDay(new Date(Date.UTC(y, m - 1, d)));
}

function utcDaysBetween(earlierKey: string, laterKey: string): number {
  const a = Date.parse(`${earlierKey}T00:00:00.000Z`);
  const b = Date.parse(`${laterKey}T00:00:00.000Z`);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function formatDifficulty(d: DifficultyLevel): "Easy" | "Medium" | "Hard" {
  const raw = d.charAt(0) + d.slice(1).toLowerCase();
  if (raw === "Easy" || raw === "Medium" || raw === "Hard") return raw;
  return "Medium";
}

function withOptionalFields(
  base: { status: DueItemStatus },
  completedAt?: string,
  daysOverdue?: number,
): { status: DueItemStatus; completedAt?: string; daysOverdue?: number } {
  return {
    ...base,
    ...(completedAt !== undefined ? { completedAt } : {}),
    ...(daysOverdue !== undefined ? { daysOverdue } : {}),
  };
}

function emptyDay(date: string): DueCalendarDaySummary {
  return {
    date,
    assignmentDue: 0,
    assignmentDone: 0,
    revisionDue: 0,
    revisionDone: 0,
    hasOverdue: false,
  };
}

function ensureDay(map: Map<string, DueCalendarDaySummary>, key: string): DueCalendarDaySummary {
  let entry = map.get(key);
  if (entry === undefined) {
    entry = emptyDay(key);
    map.set(key, entry);
  }
  return entry;
}

function isAssignmentDone(status: AssignmentStatus): boolean {
  return status === AssignmentStatus.SOLVED;
}

function isRevisionDone(status: BrainCacheRevisionStatus): boolean {
  return status === BrainCacheRevisionStatus.COMPLETED;
}

function assignmentItemStatus(
  row: { status: AssignmentStatus; solvedAt: Date | null; assignedDate: Date },
  todayKey: string,
): { status: DueItemStatus; completedAt?: string; daysOverdue?: number } {
  const dueKey = dateKey(row.assignedDate);

  if (row.status === AssignmentStatus.SKIPPED) {
    return { status: "skipped" };
  }

  if (row.status === AssignmentStatus.SOLVED) {
    const solvedKey = row.solvedAt !== null ? dateKey(row.solvedAt) : dueKey;
    const completedAt = row.solvedAt?.toISOString();
    if (solvedKey > dueKey) {
      return withOptionalFields({ status: "completed-late" }, completedAt);
    }
    return withOptionalFields({ status: "completed" }, completedAt);
  }

  const daysOverdue = utcDaysBetween(dueKey, todayKey);
  return withOptionalFields({ status: "overdue" }, undefined, Math.max(0, daysOverdue));
}

function revisionItemStatus(
  row: { status: BrainCacheRevisionStatus; completedAt: Date | null; dueDate: Date },
  todayKey: string,
): { status: DueItemStatus; completedAt?: string; daysOverdue?: number } {
  const dueKey = dateKey(row.dueDate);

  if (row.status === BrainCacheRevisionStatus.SKIPPED) {
    return withOptionalFields({ status: "skipped" }, row.completedAt?.toISOString());
  }

  if (row.status === BrainCacheRevisionStatus.COMPLETED) {
    const completedKey = row.completedAt !== null ? dateKey(row.completedAt) : dueKey;
    const completedAt = row.completedAt?.toISOString();
    if (completedKey > dueKey) {
      return withOptionalFields({ status: "completed-late" }, completedAt);
    }
    return withOptionalFields({ status: "completed" }, completedAt);
  }

  const daysOverdue = utcDaysBetween(dueKey, todayKey);
  return withOptionalFields({ status: "overdue" }, undefined, Math.max(0, daysOverdue));
}

function itemIsOverdue(status: DueItemStatus): boolean {
  return status === "overdue";
}

const assignmentInclude = {
  problem: { select: { title: true, slug: true, difficulty: true } },
  userSchedule: { include: { template: { select: { name: true } } } },
} satisfies Prisma.AssignmentInclude;

const revisionInclude = {
  playlist: { select: { name: true } },
  problem: { select: { title: true, slug: true, difficulty: true } },
} satisfies Prisma.BrainCacheRevisionTaskInclude;

export async function getDueCalendarSummary(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<DueCalendarSummaryResponse> {
  await refreshOverdueAssignments(userId);
  await refreshOpenRevisionStatuses(userId);

  const todayKey = dateKey(startOfUtcDay(new Date()));
  const from = dateFromKey(fromKey);
  const to = dateFromKey(toKey);

  const [assignments, revisions] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId, assignedDate: { gte: from, lte: to } },
      select: { assignedDate: true, status: true, solvedAt: true },
    }),
    prisma.brainCacheRevisionTask.findMany({
      where: { userId, dueDate: { gte: from, lte: to } },
      select: { dueDate: true, status: true, completedAt: true },
    }),
  ]);

  const map = new Map<string, DueCalendarDaySummary>();

  for (const row of assignments) {
    const key = dateKey(row.assignedDate);
    const day = ensureDay(map, key);
    day.assignmentDue += 1;
    if (isAssignmentDone(row.status)) {
      day.assignmentDone += 1;
    } else {
      const mapped = assignmentItemStatus(row, todayKey);
      if (itemIsOverdue(mapped.status)) {
        day.hasOverdue = true;
      }
    }
  }

  for (const row of revisions) {
    const key = dateKey(row.dueDate);
    const day = ensureDay(map, key);
    day.revisionDue += 1;
    if (isRevisionDone(row.status)) {
      day.revisionDone += 1;
    } else {
      const mapped = revisionItemStatus(row, todayKey);
      if (itemIsOverdue(mapped.status)) {
        day.hasOverdue = true;
      }
    }
  }

  const days: DueCalendarDaySummary[] = [];
  let cursor = new Date(from);
  const end = to.getTime();
  while (cursor.getTime() <= end) {
    const key = dateKey(cursor);
    days.push(map.get(key) ?? emptyDay(key));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return { days };
}

export async function getDueCalendarDay(
  userId: string,
  date: string,
): Promise<DueCalendarDayResponse> {
  await refreshOverdueAssignments(userId);
  await refreshOpenRevisionStatuses(userId);

  const todayKey = dateKey(startOfUtcDay(new Date()));
  const dueDate = dateFromKey(date);

  const [assignments, revisions] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId, assignedDate: dueDate },
      include: assignmentInclude,
      orderBy: [{ createdAt: "asc" }],
    }),
    prisma.brainCacheRevisionTask.findMany({
      where: { userId, dueDate },
      include: revisionInclude,
      orderBy: [{ createdAt: "asc" }],
    }),
  ]);

  const assignmentItems: DueCalendarItem[] = assignments.map((row) => {
    const mapped = assignmentItemStatus(row, todayKey);
    return {
      id: row.id,
      problemTitle: row.problem.title,
      problemSlug: row.problem.slug,
      difficulty: formatDifficulty(row.problem.difficulty),
      source: "assignment",
      sourceName: row.userSchedule.template.name,
      status: mapped.status,
      dueDate: date,
      ...(mapped.completedAt !== undefined ? { completedAt: mapped.completedAt } : {}),
      ...(mapped.daysOverdue !== undefined ? { daysOverdue: mapped.daysOverdue } : {}),
    };
  });

  const revisionItems: DueCalendarItem[] = revisions.map((row) => {
    const mapped = revisionItemStatus(row, todayKey);
    return {
      id: row.id,
      problemTitle: row.problem.title,
      problemSlug: row.problem.slug,
      difficulty: formatDifficulty(row.problem.difficulty),
      source: "brain-cache",
      sourceName: row.playlist.name,
      status: mapped.status,
      dueDate: date,
      ...(mapped.completedAt !== undefined ? { completedAt: mapped.completedAt } : {}),
      ...(mapped.daysOverdue !== undefined ? { daysOverdue: mapped.daysOverdue } : {}),
    };
  });

  const items = [...assignmentItems, ...revisionItems].sort((a, b) => {
    if (a.source !== b.source) {
      return a.source === "assignment" ? -1 : 1;
    }
    return a.problemTitle.localeCompare(b.problemTitle);
  });

  return { date, items };
}
